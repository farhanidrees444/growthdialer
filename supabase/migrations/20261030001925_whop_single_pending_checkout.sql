-- Reserve one unfinished checkout per customer and environment before calling the provider.
-- Do not expire/delete a reservation while its provider checkout can still be paid.
CREATE UNIQUE INDEX billing_one_pending_checkout
ON public.billing_checkout_intents(user_id, sandbox)
WHERE membership_id IS NULL;
