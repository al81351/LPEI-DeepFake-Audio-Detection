"""In-memory PDF report generator for Digital Voice Shield session analyses."""

from io import BytesIO
from datetime import datetime, timezone

import matplotlib
matplotlib.use("Agg")  # non-interactive backend — must be set before pyplot import
import matplotlib.pyplot as plt

from fpdf import FPDF

# ---------------------------------------------------------------------------
# Visual constants
# ---------------------------------------------------------------------------

_THRESHOLD = 50.0

_C_SYNTHETIC = (220, 50, 50)      # red — synthetic / alert
_C_REAL = (46, 160, 67)           # green — real / ok
_C_HEADER_BG = (30, 58, 138)      # dark blue — page headers
_C_HEADER_TEXT = (255, 255, 255)  # white
_C_TABLE_HEAD = (59, 130, 246)    # medium blue — table column headers
_C_TABLE_ALT = (239, 246, 255)    # very light blue — alternating rows
_C_SEPARATOR = (180, 180, 180)    # grey — horizontal rules


class ReportGenerator:
    """Generates PDF session reports entirely in memory using fpdf2.

    No temporary files are ever written to disk.  The PDF is built in a
    :class:`~io.BytesIO` buffer and returned as ``bytes``.

    Example::

        generator = ReportGenerator()
        pdf_bytes = generator.generate_pdf(analyses)
        # → send pdf_bytes as an HTTP response with media_type="application/pdf"
    """

    def generate_pdf(self, analyses: list[dict]) -> bytes:
        """Generates a multi-page PDF report for the given session analyses.

        Page 1 is a summary with aggregate statistics and a syntheticity bar
        chart.  Each subsequent page contains detailed metrics for one analysis.

        Args:
            analyses: List of analysis dictionaries.  Each dict must contain:
                ``file_name``, ``timestamp``, ``syntheticity_index``, ``label``,
                ``confidence``, ``is_alert``, and ``metrics`` (with sub-keys
                ``acoustic``, ``spectral``, ``artifacts``).

        Returns:
            Complete PDF file as raw ``bytes``.
        """
        pdf = FPDF()
        pdf.set_margins(15, 15, 15)
        pdf.set_auto_page_break(auto=True, margin=15)

        if not analyses:
            pdf.add_page()
            pdf.set_font("Helvetica", size=14)
            pdf.cell(0, 20, "Nenhuma análise realizada", align="C", new_x="LMARGIN", new_y="NEXT")
            return bytes(pdf.output())

        pdf.add_page()
        self._summary_page(pdf, analyses)

        for i, analysis in enumerate(analyses):
            pdf.add_page()
            self._detail_page(pdf, analysis, i + 1, len(analyses))

        return bytes(pdf.output())

    # ------------------------------------------------------------------
    # Page builders
    # ------------------------------------------------------------------

    def _summary_page(self, pdf: FPDF, analyses: list[dict]) -> None:
        """Renders the first page: title, aggregate statistics, and bar chart.

        Args:
            pdf: Active :class:`~fpdf.FPDF` instance.
            analyses: Full list of analysis dicts for the session.
        """
        # Title banner
        pdf.set_fill_color(*_C_HEADER_BG)
        pdf.set_text_color(*_C_HEADER_TEXT)
        pdf.set_font("Helvetica", style="B", size=18)
        pdf.cell(
            0, 14, "Digital Voice Shield - Relatório de Análise",
            align="C", fill=True, new_x="LMARGIN", new_y="NEXT",
        )

        pdf.set_text_color(0, 0, 0)
        pdf.set_font("Helvetica", size=10)
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        pdf.cell(0, 8, f"Gerado em: {now}", align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(5)

        # Aggregate stats
        total = len(analyses)
        synthetic_count = sum(1 for a in analyses if a.get("label") == "synthetic")
        real_count = total - synthetic_count
        indices = [a.get("syntheticity_index", 0.0) for a in analyses]
        mean_index = sum(indices) / total

        pdf.set_font("Helvetica", style="B", size=12)
        pdf.cell(0, 8, "Resumo da Sessão", new_x="LMARGIN", new_y="NEXT")

        stats = [
            ("Total de análises", str(total)),
            ("Sintéticas", str(synthetic_count)),
            ("Reais", str(real_count)),
            ("Índice médio de sinteticidade", f"{mean_index:.1f}%"),
        ]
        for label, value in stats:
            pdf.set_font("Helvetica", style="B", size=11)
            pdf.cell(100, 7, label + ":", new_x="RIGHT", new_y="TOP")
            pdf.set_font("Helvetica", size=11)
            pdf.cell(0, 7, value, new_x="LMARGIN", new_y="NEXT")

        pdf.ln(6)

        # Bar chart
        chart_buf = self._build_chart(analyses)
        pdf.image(chart_buf, x=15, w=180)
        chart_buf.close()

    def _detail_page(self, pdf: FPDF, analysis: dict, index: int, total: int) -> None:
        """Renders one detail page for a single analysis.

        Args:
            pdf: Active :class:`~fpdf.FPDF` instance.
            analysis: Single analysis dictionary.
            index: 1-based position of this analysis in the session.
            total: Total number of analyses in the session.
        """
        file_name = analysis.get("file_name", "unknown")
        timestamp = analysis.get("timestamp", "")
        syntheticity = analysis.get("syntheticity_index", 0.0)
        label = analysis.get("label", "unknown")
        confidence = analysis.get("confidence", 0.0)
        metrics = analysis.get("metrics", {})
        acoustic = metrics.get("acoustic", {})
        spectral = metrics.get("spectral", {})
        artifacts = metrics.get("artifacts", {})

        # Header strip
        pdf.set_fill_color(*_C_HEADER_BG)
        pdf.set_text_color(*_C_HEADER_TEXT)
        pdf.set_font("Helvetica", style="B", size=13)
        pdf.cell(
            0, 11, f"Análise {index}/{total} - {file_name}",
            fill=True, align="C", new_x="LMARGIN", new_y="NEXT",
        )
        pdf.set_text_color(0, 0, 0)
        pdf.set_font("Helvetica", size=9)
        pdf.cell(0, 6, f"Timestamp: {timestamp}", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

        # Syntheticity index — large, coloured
        color = _C_SYNTHETIC if label == "synthetic" else _C_REAL
        pdf.set_text_color(*color)
        pdf.set_font("Helvetica", style="B", size=28)
        pdf.cell(0, 14, f"{syntheticity:.1f}%", align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", style="B", size=12)
        pdf.cell(
            0, 8,
            f"{label.upper()}  (confiança: {confidence:.1f}%)",
            align="C", new_x="LMARGIN", new_y="NEXT",
        )
        pdf.set_text_color(0, 0, 0)
        pdf.ln(5)

        # Acoustic metrics table
        acoustic_rows = [
            ("Duração (s)", acoustic.get("duration_seconds", "N/A")),
            ("Frequência dominante (Hz)", acoustic.get("dominant_frequency", "N/A")),
            ("Energia RMS", acoustic.get("rms_energy", "N/A")),
            ("Taxa de zero-crossing", acoustic.get("zero_crossing_rate", "N/A")),
        ]
        self._draw_table(pdf, "Métricas Acústicas", acoustic_rows)
        pdf.ln(4)

        # Spectral metrics table
        spectral_rows = [
            ("Centroide Espectral (Hz)", spectral.get("spectral_centroid", "N/A")),
            ("Rolloff Espectral (Hz)", spectral.get("spectral_rolloff", "N/A")),
            ("Flatness Espectral", spectral.get("spectral_flatness", "N/A")),
        ]
        self._draw_table(pdf, "Métricas Espectrais", spectral_rows)
        pdf.ln(4)

        # Artifacts
        pdf.set_font("Helvetica", style="B", size=11)
        pdf.cell(0, 7, "Artefactos Detectados", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", size=10)
        detected: list[str] = artifacts.get("artifacts_detected", [])
        if detected:
            pdf.set_text_color(*_C_SYNTHETIC)
            pdf.cell(0, 6, ", ".join(detected), new_x="LMARGIN", new_y="NEXT")
        else:
            pdf.set_text_color(*_C_REAL)
            pdf.cell(0, 6, "Nenhum", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(0, 0, 0)

        # Separator line
        pdf.ln(4)
        pdf.set_draw_color(*_C_SEPARATOR)
        pdf.line(15, pdf.get_y(), 195, pdf.get_y())

    def _draw_table(self, pdf: FPDF, title: str, rows: list[tuple]) -> None:
        """Renders a labelled two-column key/value table.

        Args:
            pdf: Active :class:`~fpdf.FPDF` instance.
            title: Section heading printed above the table.
            rows: List of ``(label, value)`` pairs.
        """
        col_label_w = 100
        col_value_w = 80
        row_h = 7

        pdf.set_font("Helvetica", style="B", size=11)
        pdf.cell(0, row_h, title, new_x="LMARGIN", new_y="NEXT")

        # Column headers
        pdf.set_fill_color(*_C_TABLE_HEAD)
        pdf.set_text_color(*_C_HEADER_TEXT)
        pdf.set_font("Helvetica", style="B", size=9)
        pdf.cell(col_label_w, row_h, "Métrica", border=1, fill=True, new_x="RIGHT", new_y="TOP")
        pdf.cell(col_value_w, row_h, "Valor", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(0, 0, 0)

        # Data rows with alternating background
        pdf.set_font("Helvetica", size=9)
        for i, (label, value) in enumerate(rows):
            fill = i % 2 == 0
            if fill:
                pdf.set_fill_color(*_C_TABLE_ALT)
            value_str = f"{value:.4f}" if isinstance(value, float) else str(value)
            pdf.cell(col_label_w, row_h, label, border=1, fill=fill, new_x="RIGHT", new_y="TOP")
            pdf.cell(col_value_w, row_h, value_str, border=1, fill=fill, new_x="LMARGIN", new_y="NEXT")

    def _build_chart(self, analyses: list[dict]) -> BytesIO:
        """Generates a syntheticity bar chart as a PNG in a BytesIO buffer.

        Bars above the alert threshold are coloured red; bars at or below are
        green.  The matplotlib figure is closed immediately after saving to
        avoid memory leaks.

        Args:
            analyses: Full list of analysis dicts.

        Returns:
            Seeked :class:`~io.BytesIO` containing a PNG image.
        """
        indices = [a.get("syntheticity_index", 0.0) for a in analyses]
        raw_labels = [a.get("file_name", f"#{i+1}") for i, a in enumerate(analyses)]
        short_labels = [lbl[:15] + "…" if len(lbl) > 16 else lbl for lbl in raw_labels]

        colors = [
            f"#{_C_SYNTHETIC[0]:02x}{_C_SYNTHETIC[1]:02x}{_C_SYNTHETIC[2]:02x}"
            if idx > _THRESHOLD else
            f"#{_C_REAL[0]:02x}{_C_REAL[1]:02x}{_C_REAL[2]:02x}"
            for idx in indices
        ]

        fig, ax = plt.subplots(figsize=(10, 4))
        x = range(len(indices))
        ax.bar(x, indices, color=colors)
        ax.axhline(
            _THRESHOLD, color="orange", linestyle="--", linewidth=1,
            label=f"Limiar ({_THRESHOLD:.0f}%)",
        )
        ax.set_xticks(list(x))
        ax.set_xticklabels(short_labels, rotation=30, ha="right", fontsize=8)
        ax.set_ylabel("Índice de Sinteticidade (%)")
        ax.set_title("Índice de Sinteticidade por Análise")
        ax.set_ylim(0, 105)
        ax.legend()

        buf = BytesIO()
        fig.tight_layout()
        fig.savefig(buf, format="png", dpi=100)
        plt.close(fig)
        buf.seek(0)
        return buf
