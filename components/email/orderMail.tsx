import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function OrderConfirmEmail({
  buyerName,
  buyerEmail,
  orderId,
}: {
  buyerName: string;
  buyerEmail: string;
  orderId: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>New Order Received - AgroStack</Preview>

      <Tailwind>
        <Body className="bg-gray-100 py-10 font-sans">
          <Container className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow">

            <Heading className="text-2xl font-bold text-green-700">
              New Order Received 🌱
            </Heading>

            <Text className="mt-4">
              You have received a new order on <strong>AgroStack</strong>.
            </Text>

            <Section className="mt-4 rounded-lg border bg-gray-50 p-4">
              <Text><strong>Order ID:</strong> {orderId}</Text>
              <Text><strong>Buyer Name:</strong> {buyerName}</Text>
              <Text><strong>Buyer Email:</strong> {buyerEmail}</Text>
            </Section>

            <Text className="mt-6 text-sm text-gray-500">
              Please log in to your dashboard to view and manage this order.
            </Text>

            <Text className="mt-6 text-xs text-gray-400">
              AgroStack • Connecting Farmers & Buyers Directly
            </Text>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
