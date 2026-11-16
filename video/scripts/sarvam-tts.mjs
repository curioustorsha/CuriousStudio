// First Sarvam text-to-speech call: says one line with Bulbul and saves a WAV.
//   npm run sarvam:tts -- "Your line here" [--speaker=simran_en_customer] [--lang=en-IN] [--out=out/sarvam.wav]
import { SarvamAIClient } from "sarvamai";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const text = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "Welcome to Curiously. Today, a small question with a surprising answer.";
const out = arg("out", "out/sarvam.wav");

const client = new SarvamAIClient({ apiSubscriptionKey: process.env.SARVAM_API_KEY });
const res = await client.textToSpeech.convert({
  text,
  model: "bulbul:v4-flash",
  language_code: arg("lang", "en-IN"),
  speaker: arg("speaker", "simran_en_customer"),
});
const audio = Buffer.from(res.audios.join(""), "base64");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, audio);
console.log(`request ${res.request_id}: ${audio.length} bytes → ${out}`);
