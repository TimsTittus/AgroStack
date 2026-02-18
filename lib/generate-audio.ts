import { ElevenLabsClient } from "elevenlabs";
import fs from "fs";

const client = new ElevenLabsClient({
  apiKey: "sk_9f87d0dbd6c6622b4d4a7b50c2225a23860adbc8d8b42505",
});

async function main() {
  const stream = await client.textToSpeech.convert(
  "JBFqnCBsd6RMkjVDRZzb",
  {
    text: "നിങ്ങൾക്ക് ഒരു പുതിയ ഓർഡർ ലഭിച്ചിട്ടുണ്ട്. ഓർഡർ സ്ഥിരീകരിക്കാൻ ഒന്ന് അമർത്തുക. ഓർഡർ നിരസിക്കാൻ രണ്ട് അമർത്തുക.",
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.4,
      similarity_boost: 0.8
    }
  }
);

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  fs.writeFileSync("output.mp3", Buffer.concat(chunks));
  console.log("Saved output.mp3");
}

main();
