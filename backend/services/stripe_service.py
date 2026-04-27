import stripe
import config

stripe.api_key = config.STRIPE_SECRET_KEY

def create_payment_intent(amount_cents: int, booking_id: str) -> stripe.PaymentIntent:
    return stripe.PaymentIntent.create(
        amount=amount_cents,
        currency="aud",
        payment_method_types=["card"],
        metadata={"booking_id": booking_id},
    )

def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
    return stripe.Webhook.construct_event(payload, sig_header, config.STRIPE_WEBHOOK_SECRET)
