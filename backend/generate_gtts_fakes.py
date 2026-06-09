"""
Gera clips TTS sintéticos usando Google TTS (gTTS) em Português.

Complementa o Edge TTS com um segundo engine TTS — padrões acústicos diferentes,
o que torna o modelo mais robusto a engines que não viu em treino.

Install : pip install gtts
Run     : python generate_gtts_fakes.py
          python generate_gtts_fakes.py --count 250
"""

import argparse
import os
import random
import sys
import time

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "deepfake_audio")

# tld='pt'  → sotaque europeu (Portugal)
# tld='com.br' → sotaque brasileiro
LOCALES = [
    ("pt", "pt"),       # Europeu
    ("pt", "com.br"),   # Brasileiro
]

SENTENCES_PT = [
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
    "Os estudantes participaram activamente no debate sobre inteligência artificial.",
    "A nova lei de protecção de dados entrou em vigor no início do ano.",
    "O médico recomendou repouso e hidratação para uma recuperação rápida.",
    "A equipa de investigação publicou um artigo inovador sobre detecção de voz.",
    "O porto de Lisboa recebeu dezasseis navios de cruzeiro esta semana.",
    "A universidade abriu candidaturas para bolsas de investigação doutoral.",
    "Os resultados do estudo foram apresentados num congresso internacional.",
    "A estação de comboios foi renovada e ganhou novas instalações modernas.",
    "O ministério anunciou um investimento significativo na área da saúde.",
    "A câmara de vídeo captou imagens de alta resolução durante o evento.",
    "O programa de inteligência artificial foi desenvolvido por uma equipa portuguesa.",
    "As técnicas de aprendizagem automática melhoram a precisão dos diagnósticos.",
    "O novo regulamento europeu afecta directamente as empresas tecnológicas.",
    "A floresta foi destruída por um incêndio que durou três dias seguidos.",
    "O laboratório dispõe de equipamentos de análise acústica de última geração.",
]


def main(count: int, delay: float) -> None:
    try:
        from gtts import gTTS
    except ImportError:
        print("gTTS não instalado. Corre primeiro:")
        print("  pip install gtts")
        sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Find next available index
    existing = {f for f in os.listdir(OUTPUT_DIR) if f.startswith("tts_gtts_")}
    start_index = 0
    while f"tts_gtts_{start_index:04d}.mp3" in existing:
        start_index += 1

    print(f"A gerar {count} clips Google TTS PT (a partir do índice {start_index})...")
    generated = 0
    failed = 0

    for i in range(count):
        idx = start_index + i
        out_path = os.path.join(OUTPUT_DIR, f"tts_gtts_{idx:04d}.mp3")
        text = random.choice(SENTENCES_PT)
        lang, tld = random.choice(LOCALES)

        try:
            tts = gTTS(text=text, lang=lang, tld=tld)
            tts.save(out_path)
            generated += 1
            if generated % 50 == 0:
                print(f"  {generated}/{count} gerados...")
            time.sleep(delay)
        except Exception as exc:
            print(f"  [AVISO] clip {idx:04d} falhou: {exc}")
            failed += 1
            time.sleep(delay * 2)

    print(f"\nConcluído: {generated}/{count} clips gerados em '{OUTPUT_DIR}'")
    if failed:
        print(f"  {failed} falharam — tenta novamente se necessário.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Gera áudio TTS sintético com Google TTS em Português."
    )
    parser.add_argument(
        "--count", type=int, default=250,
        help="Número de clips a gerar (default: 250)",
    )
    parser.add_argument(
        "--delay", type=float, default=0.4,
        help="Pausa entre pedidos em segundos para evitar rate limiting (default: 0.4)",
    )
    args = parser.parse_args()

    random.seed(42)
    main(args.count, args.delay)
