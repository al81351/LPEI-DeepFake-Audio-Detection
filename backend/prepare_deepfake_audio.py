"""
Ajusta data/deepfake_audio/ para ficares com:
  - 500 ASVspoof FLAC  (remove 500 dos 1000 actuais — TTS de 2019, muito fáceis)
  - 12 WAV manuais     (ElevenLabs, FakeAVCeleb — mantém)
  - 500 Edge TTS mixed (tts_edge_*.mp3 — mantém)
  - 250 Edge TTS PT    (tts_edge_pt_*.mp3 — gerados com --pt-only)
  - 250 Google TTS PT  (tts_gtts_*.mp3   — gerados com generate_gtts_fakes.py)
  ─────────────────────────────────────────────────────────────────────
  Total: ~1512 fake  vs  ~1513 real  → balanço perfeito

Pré-requisitos (correr primeiro):
  python generate_tts_fakes.py --count 250 --pt-only
  python generate_gtts_fakes.py --count 250

Uso:
  python prepare_deepfake_audio.py
"""

import os
import sys
import random

DEEPFAKE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "deepfake_audio")
N_KEEP_ASVSPOOF = 500
RANDOM_SEED = 42


def main() -> None:
    if not os.path.isdir(DEEPFAKE_DIR):
        print(f"ERRO: pasta não encontrada — {DEEPFAKE_DIR}")
        sys.exit(1)

    random.seed(RANDOM_SEED)
    all_files = os.listdir(DEEPFAKE_DIR)

    # ── Inventário actual ─────────────────────────────────────────────────────
    flac_files   = sorted(f for f in all_files if f.endswith(".flac") and f.startswith("LA_T_"))
    wav_files    = [f for f in all_files if f.endswith(".wav")]
    edge_mixed   = [f for f in all_files if f.startswith("tts_edge_") and not f.startswith("tts_edge_pt_")]
    edge_pt      = [f for f in all_files if f.startswith("tts_edge_pt_")]
    gtts_files   = [f for f in all_files if f.startswith("tts_gtts_")]

    print("── Inventário actual ─────────────────────────────────────────────")
    print(f"  ASVspoof FLAC (LA_T_*) : {len(flac_files)}")
    print(f"  WAV manuais            : {len(wav_files)}")
    print(f"  Edge TTS mixed         : {len(edge_mixed)}")
    print(f"  Edge TTS PT            : {len(edge_pt)}")
    print(f"  Google TTS PT          : {len(gtts_files)}")
    print(f"  TOTAL                  : {len(all_files)}")

    # ── Verificar pré-requisitos ──────────────────────────────────────────────
    warnings = []
    if len(edge_pt) == 0:
        warnings.append("Edge TTS PT (tts_edge_pt_*.mp3) — corre: python generate_tts_fakes.py --count 250 --pt-only")
    if len(gtts_files) == 0:
        warnings.append("Google TTS PT (tts_gtts_*.mp3)  — corre: python generate_gtts_fakes.py --count 250")
    if warnings:
        print("\nAVISO: faltam ficheiros gerados:")
        for w in warnings:
            print(f"  ⚠  {w}")
        print("\nO script pode continuar mas o dataset ficará menos equilibrado.")
        input("Pressiona Enter para continuar mesmo assim, ou Ctrl+C para cancelar...")

    # ── Remover ASVspoof excedentes ───────────────────────────────────────────
    if len(flac_files) <= N_KEEP_ASVSPOOF:
        print(f"\nASVspoof: já tens {len(flac_files)} ≤ {N_KEEP_ASVSPOOF} — nenhum removido.")
    else:
        to_keep   = set(random.sample(flac_files, N_KEEP_ASVSPOOF))
        to_remove = [f for f in flac_files if f not in to_keep]
        for f in to_remove:
            os.remove(os.path.join(DEEPFAKE_DIR, f))
        print(f"\nASVspoof FLAC: mantidos {N_KEEP_ASVSPOOF}, removidos {len(to_remove)}")

    # ── Resumo final ──────────────────────────────────────────────────────────
    final = os.listdir(DEEPFAKE_DIR)
    flac_f  = sum(1 for f in final if f.endswith(".flac"))
    wav_f   = sum(1 for f in final if f.endswith(".wav"))
    emix_f  = sum(1 for f in final if f.startswith("tts_edge_") and not f.startswith("tts_edge_pt_"))
    ept_f   = sum(1 for f in final if f.startswith("tts_edge_pt_"))
    gtts_f  = sum(1 for f in final if f.startswith("tts_gtts_"))

    print(f"\n── Resumo data/deepfake_audio/ ───────────────────────────────────")
    print(f"  ASVspoof FLAC (TTS 2019)  : {flac_f}")
    print(f"  WAV manuais (ElevenLabs…) : {wav_f}")
    print(f"  Edge TTS mixed            : {emix_f}")
    print(f"  Edge TTS PT               : {ept_f}")
    print(f"  Google TTS PT             : {gtts_f}")
    print(f"  TOTAL                     : {len(final)}")
    print(f"──────────────────────────────────────────────────────────────────")
    print(f"\nPróximo passo:  python train.py")


if __name__ == "__main__":
    main()
