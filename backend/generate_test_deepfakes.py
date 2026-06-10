"""
Gera 20 clips deepfake variados para teste manual.
Guardados em: Downloads/deepfake_test_20/
"""
import asyncio, os, random, sys

OUTPUT_DIR = os.path.join(os.environ["USERPROFILE"], "Downloads", "deepfake_test_20")

# Mix de vozes: PT, EN, ES — para testar robustez
CLIPS = [
    # PT-PT
    ("pt-PT-DuarteNeural",      "O sistema de inteligência artificial analisa padrões de voz em tempo real."),
    ("pt-PT-RaquelNeural",      "Gostaria de visitar Lisboa no próximo verão com a minha família."),
    ("pt-PT-DuarteNeural",      "A conferência internacional decorreu durante três dias consecutivos."),
    ("pt-PT-RaquelNeural",      "Os alunos estudaram muito para o exame de física quântica."),
    ("pt-PT-DuarteNeural",      "A tecnologia avança rapidamente e transforma o mundo à nossa volta."),
    # PT-BR
    ("pt-BR-FranciscaNeural",   "A biblioteca da universidade tem mais de duzentos mil livros."),
    ("pt-BR-AntonioNeural",     "O festival de música vai decorrer no próximo fim de semana."),
    ("pt-BR-ThalitaNeural",     "As previsões meteorológicas indicam chuva para os próximos três dias."),
    ("pt-BR-FranciscaNeural",   "A empresa anunciou um novo produto revolucionário para o mercado."),
    ("pt-BR-AntonioNeural",     "O relatório final deve ser entregue até ao final desta semana."),
    # EN-US
    ("en-US-AriaNeural",        "Voice cloning technology has become increasingly accessible to the public."),
    ("en-US-GuyNeural",         "Deep learning models can distinguish real from generated speech signals."),
    ("en-US-JennyNeural",       "Modern text-to-speech systems produce remarkably natural sounding voices."),
    ("en-US-BrianNeural",       "The algorithm detects subtle acoustic artefacts in synthetic audio recordings."),
    ("en-US-EmmaNeural",        "Artificial intelligence is transforming how we interact with computers today."),
    # EN-GB
    ("en-GB-SoniaNeural",       "The researchers published their findings on neural speech synthesis methods."),
    ("en-GB-RyanNeural",        "Scientists are studying the effects of climate change on ocean life."),
    # ES
    ("es-ES-AlvaroNeural",      "La tecnología de síntesis de voz ha mejorado enormemente en los últimos años."),
    # FR
    ("fr-FR-DeniseNeural",      "La technologie de synthèse vocale progresse rapidement dans le monde entier."),
    # DE
    ("de-DE-KatjaNeural",       "Sprachsynthese-Technologie hat sich in den letzten Jahren stark verbessert."),
]

async def gen_one(idx, voice, text, sem):
    async with sem:
        try:
            import edge_tts
            out = os.path.join(OUTPUT_DIR, f"deepfake_{idx+1:02d}_{voice.split('-')[0]}-{voice.split('-')[1]}.mp3")
            await edge_tts.Communicate(text, voice).save(out)
            print(f"  [OK] {idx+1:02d}. {voice}")
            return True
        except Exception as e:
            print(f"  [ERRO] {idx+1:02d}. {voice} - {e}")
            return False

async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"A gerar 20 clips deepfake para teste...\nPasta: {OUTPUT_DIR}\n")
    sem = asyncio.Semaphore(5)
    results = await asyncio.gather(*[gen_one(i, v, t, sem) for i, (v, t) in enumerate(CLIPS)])
    ok = sum(results)
    print(f"\n{'='*50}")
    print(f"Gerados: {ok}/20  →  {OUTPUT_DIR}")

asyncio.run(main())
