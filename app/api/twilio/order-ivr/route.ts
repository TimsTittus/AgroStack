import { twiml } from "twilio";

export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get("orderId");
        const userId = searchParams.get("userId");

        const voiceResponse = new twiml.VoiceResponse();

        const gather = voiceResponse.gather({
            numDigits: 1,
            action: `/api/twilio/order-response?orderId=${orderId}&userId=${userId}`,
            method: "POST",
        });
        try {
            gather.play("https://pub-8b33371e4456417999c86de46a1cae55.r2.dev/uploads/output.mp3");
        } catch (err) {
            console.error("Error adding audio to IVR:", err);
        }

        voiceResponse.redirect(`/api/twilio/order-ivr?orderId=${orderId}`);

        return new Response(voiceResponse.toString(), {
            headers: { "Content-Type": "text/xml" },
        });
    } catch (err) {
        console.error("Error in IVR response:", err);
        return new Response("Error", { status: 500 });
    }
}
