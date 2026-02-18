import { twiml } from "twilio";
import { eq } from "drizzle-orm";
import { db } from "@/db/index";
import { orders, inventory } from "@/db/schema";
import { generateInventoryDescription } from "@/lib/inv-ai";
import generateAudio from "@/lib/generate-audio";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const digit = formData.get("Digits");

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const userId = searchParams.get("userId");

    console.log("User ID from session:", userId);
    const voiceResponse = new twiml.VoiceResponse();

    if (!orderId) {
      voiceResponse.play("https://pub-8b33371e4456417999c86de46a1cae55.r2.dev/uploads/notfound.mp3(1).mp3"); //ok
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
    else if (digit === "3") {
      const inventoryData = await db
        .select()
        .from(inventory)
        .where(eq(inventory.userId, userId));
      
      const description = await generateInventoryDescription(inventoryData);
      console.log("Inventory Description:", description);
      const audioUrl = await generateAudio(description);
      console.log("Generated audio URL:", audioUrl);
      voiceResponse.play(audioUrl);
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
