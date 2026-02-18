import { twiml } from "twilio";
import { eq } from "drizzle-orm";
import {db} from "@/db/index";
import { orders } from "@/db/schema";
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const digit = formData.get("Digits");

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    const voiceResponse = new twiml.VoiceResponse();

    if (!orderId) {
      voiceResponse.play("https://pub-8b33371e4456417999c86de46a1cae55.r2.dev/uploads/notfound.mp3(1).mp3") //ok
    } 
    else if (digit === "1") {
      await db
        .update(orders)
        .set({ status: "confirmed" })
        .where(eq(orders.id, orderId));

      voiceResponse.play("https://pub-8b33371e4456417999c86de46a1cae55.r2.dev/uploads/output2.mp3(2).mp3"); //okk
    } 
    else if (digit === "2") {
      await db
        .update(orders)
        .set({ status: "rejected" })
        .where(eq(orders.id, orderId));

      voiceResponse.play("https://pub-8b33371e4456417999c86de46a1cae55.r2.dev/uploads/output3.mp3(1).mp3");
    } 
    else {
      voiceResponse.play("https://pub-8b33371e4456417999c86de46a1cae55.r2.dev/uploads/output4.mp3.mp3");
    }

    return new Response(voiceResponse.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("Error handling IVR input:", err);
    return new Response("Error", { status: 500 });
  }
}
