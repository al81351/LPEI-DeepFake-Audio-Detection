"""
Generates synthetic TTS audio clips for deepfake-detection training.

Uses Microsoft Edge TTS (edge-tts) — neural voice synthesis, free, no GPU needed.
Produces MP3 files that train.py already supports.

Install : pip install edge-tts
Run     : python generate_tts_fakes.py                        # 500 clips mixed
          python generate_tts_fakes.py --count 250 --pt-only  # 250 clips PT only
          python generate_tts_fakes.py --count 500 --concurrency 15
"""

import argparse
import asyncio
import os
import random
import sys

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "deepfake_audio")

# ---------------------------------------------------------------------------
# Neural voices — diverse speakers, genders, accents, languages
# ---------------------------------------------------------------------------
VOICES = [
    # Portuguese (PT)
    "pt-PT-DuarteNeural",
    "pt-PT-RaquelNeural",
    # Portuguese (BR)
    "pt-BR-FranciscaNeural",
    "pt-BR-AntonioNeural",
    "pt-BR-ThalitaNeural",
    # English (US)
    "en-US-AriaNeural",
    "en-US-GuyNeural",
    "en-US-JennyNeural",
    "en-US-BrianNeural",
    "en-US-EmmaNeural",
    # English (GB)
    "en-GB-SoniaNeural",
    "en-GB-RyanNeural",
    "en-GB-LibbyNeural",
    # Spanish
    "es-ES-AlvaroNeural",
    "es-ES-ElviraNeural",
    # French
    "fr-FR-DeniseNeural",
    "fr-FR-HenriNeural",
    # German
    "de-DE-KatjaNeural",
    "de-DE-ConradNeural",
    # Italian
    "it-IT-ElsaNeural",
    "it-IT-DiegoNeural",
]

# ---------------------------------------------------------------------------
# Sentences — diverse topics, lengths, and languages
# ---------------------------------------------------------------------------
SENTENCES = [
    # --- Português ---
    "O sol nasce a este e põe-se a oeste todos os dias da semana.",
    "As crianças brincam no jardim durante a tarde de domingo.",
    "O comboio chegou à estação com cinco minutos de atraso.",
    "A investigadora descobriu uma nova espécie de planta na floresta.",
    "O livro que compraste ontem já está na prateleira da sala.",
    "Os pássaros cantam de manhã cedo quando o dia começa.",
    "A reunião de equipa ficou marcada para as dez horas da manhã.",
    "O mercado estava cheio de frutas e legumes frescos nesta manhã.",
    "A professora explicou o problema de matemática com muita paciência.",
    "Gostaria de visitar Lisboa no próximo verão com a minha família.",
    "O relatório final deve ser entregue até ao final desta semana.",
    "A conferência internacional decorreu durante três dias consecutivos.",
    "Os alunos estudaram muito para o exame de física quântica.",
    "A receita do bolo de chocolate leva duas colheres de fermento.",
    "O sistema de inteligência artificial analisa padrões de voz em tempo real.",
    "A tecnologia avança rapidamente e transforma o mundo à nossa volta.",
    "O hospital recebeu vinte e três novos pacientes durante a noite.",
    "As previsões meteorológicas indicam chuva para os próximos três dias.",
    "A empresa anunciou um novo produto revolucionário para o mercado.",
    "O cientista apresentou os resultados da sua investigação ao público.",
    "A biblioteca da universidade tem mais de duzentos mil livros.",
    "O festival de música vai decorrer no próximo fim de semana.",
    "A nossa equipa desenvolveu um algoritmo eficiente de classificação.",
    "O avião aterrou no aeroporto com trinta minutos de antecipação.",
    "A câmara municipal aprovou o novo plano de urbanização da cidade.",
    # --- English ---
    "The quick brown fox jumps over the lazy dog by the river.",
    "Scientists have discovered a new method to generate clean energy.",
    "The weather forecast predicts heavy rain for the next three days.",
    "She completed the marathon in just under four hours last Sunday.",
    "The annual conference will be held in the city centre next month.",
    "Researchers published their findings on neural speech synthesis.",
    "The train departed the station precisely at seven in the morning.",
    "Children learn best when they are engaged and motivated to study.",
    "The documentary explored the impact of technology on modern society.",
    "He submitted the final report just before the midnight deadline.",
    "The new software update improves performance by thirty percent.",
    "Scientists are studying the effects of climate change on ocean life.",
    "The museum opened a new exhibition on ancient civilisations.",
    "Her presentation on machine learning received excellent feedback.",
    "The library contains thousands of books on science and history.",
    "The team worked through the night to fix the critical bug.",
    "Artificial intelligence is transforming how we interact with computers.",
    "The patient recovered quickly after the successful surgery.",
    "A new species of deep-sea fish was discovered near the Pacific.",
    "The university announced a new scholarship programme for students.",
    "Voice cloning technology has become increasingly accessible.",
    "The algorithm detects subtle acoustic artefacts in synthetic audio.",
    "Deep learning models can distinguish real from generated speech.",
    "The recording studio produced high-quality audio tracks all day.",
    "Modern text-to-speech systems produce remarkably natural sounding voices.",
    # --- Spanish ---
    "El sol brilla con fuerza durante los días de verano en el sur.",
    "Los niños juegan en el parque por las tardes del fin de semana.",
    "La reunión de trabajo empezará a las nueve de la mañana.",
    "El investigador presentó sus hallazgos en el congreso internacional.",
    "La tecnología de síntesis de voz ha mejorado enormemente.",
    # --- French ---
    "Le soleil se lève à l'est et se couche à l'ouest chaque jour.",
    "Les enfants jouent dans le jardin pendant l'après-midi du dimanche.",
    "La réunion d'équipe est prévue pour dix heures du matin.",
    "Le chercheur a découvert une nouvelle espèce de plante en forêt.",
    "La technologie de synthèse vocale progresse rapidement.",
    # --- German ---
    "Die Sonne geht im Osten auf und im Westen unter jeden Tag.",
    "Die Kinder spielen nachmittags im Garten am Wochenende gerne.",
    "Der Zug kam mit fünf Minuten Verspätung am Bahnhof an.",
    "Der Forscher stellte seine Ergebnisse auf der Konferenz vor.",
    "Sprachsynthese-Technologie hat sich in den letzten Jahren stark verbessert.",
]


# ---------------------------------------------------------------------------
# Core generation logic
# ---------------------------------------------------------------------------

async def _generate_one(
    idx: int,
    text: str,
    voice: str,
    out_path: str,
    sem: asyncio.Semaphore,
) -> bool:
    async with sem:
        try:
            import edge_tts  # imported inside to give a clear error early
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(out_path)
            return True
        except Exception as exc:
            print(f"  [AVISO] clip {idx:04d} falhou ({voice}): {exc}")
            return False


VOICES_PT = [v for v in VOICES if v.startswith("pt-")]
SENTENCES_PT = [s for s in SENTENCES if any(
    word in s for word in ["O ", "A ", "Os ", "As ", "Um ", "Uma ", "No ", "Na ",
                           "comboio", "sol", "crianças", "livro", "pássaro",
                           "reunião", "mercado", "professora", "Lisboa", "relatório",
                           "conferência", "alunos", "receita", "sistema", "tecnologia",
                           "hospital", "previsões", "empresa", "cientista", "biblioteca",
                           "festival", "equipa", "avião", "câmara"]
)]


async def generate(count: int, concurrency: int, skip_existing: bool, pt_only: bool) -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    voices    = VOICES_PT    if pt_only else VOICES
    sentences = SENTENCES_PT if pt_only else SENTENCES
    prefix    = "tts_edge_pt" if pt_only else "tts_edge"

    if pt_only:
        print(f"Modo PT only: {len(voices)} vozes PT, {len(sentences)} frases PT")

    sem = asyncio.Semaphore(concurrency)
    tasks = []
    skipped = 0

    # Find next available index to avoid overwriting existing files
    existing = {f for f in os.listdir(OUTPUT_DIR) if f.startswith(prefix + "_")}
    start_index = 0
    while f"{prefix}_{start_index:04d}.mp3" in existing:
        start_index += 1

    for i in range(count):
        idx = start_index + i
        out_path = os.path.join(OUTPUT_DIR, f"{prefix}_{idx:04d}.mp3")
        if skip_existing and os.path.exists(out_path) and os.path.getsize(out_path) > 1024:
            skipped += 1
            continue
        text  = random.choice(sentences)
        voice = random.choice(voices)
        tasks.append(_generate_one(idx, text, voice, out_path, sem))

    if skipped:
        print(f"  {skipped} clips já existem, a saltar…")

    to_generate = len(tasks)
    if to_generate == 0:
        print("Nada a gerar — todos os clips já existem.")
        return

    print(f"A gerar {to_generate} clips com {len(voices)} vozes diferentes…")
    results = await asyncio.gather(*tasks)
    ok = sum(results)
    print(f"\nConcluído: {ok}/{to_generate} novos clips gerados em '{OUTPUT_DIR}'")
    if ok < to_generate:
        print(f"  {to_generate - ok} falharam — tenta novamente.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    try:
        import edge_tts as _  # noqa: F401
    except ImportError:
        print("edge-tts não instalado. Corre primeiro:")
        print("  pip install edge-tts")
        sys.exit(1)

    parser = argparse.ArgumentParser(
        description="Gera áudio TTS sintético para treino do classificador deepfake."
    )
    parser.add_argument(
        "--count",
        type=int,
        default=500,
        help="Número de clips a gerar (default: 500)",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=10,
        help="Pedidos paralelos ao serviço TTS (default: 10)",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        default=True,
        help="Não regenera clips que já existem (default: True)",
    )
    parser.add_argument(
        "--pt-only",
        action="store_true",
        default=False,
        help="Gera apenas com vozes PT (pt-PT e pt-BR) e frases em português",
    )
    args = parser.parse_args()

    asyncio.run(generate(args.count, args.concurrency, args.skip_existing, args.pt_only))


if __name__ == "__main__":
    main()
