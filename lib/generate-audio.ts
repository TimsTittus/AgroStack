export default async function generateAudio(text: string) {
  const response = await fetch("https://api.murf.ai/v1/speech/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "api-key": process.env.MURF_API_KEY || ""
  },
  body: JSON.stringify({
    text: text,
    voiceId: "Alicia", 
    format: "mp3"
  })
});

interface AudioResponse {
  audioFile: string;
}

const data = await response.json() as AudioResponse;
return data.audioFile;

}