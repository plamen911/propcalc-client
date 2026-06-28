/**
 * Company / broker identity — single source of truth.
 *
 * These values are currently hard-coded on the client. If the backend later
 * exposes them (e.g. in the /api/v1/form-data/initial-data response), read from
 * there and fall back to these constants — but keep a hard-coded default, since
 * our_office_name appears in a legally significant consent declaration.
 */

// Brand / tagline shown next to the logo.
export const our_broker_name = 'ЗАСТРАХОВАЙТЕ С ДАЙКЕ';

// Legal entity / data controller. Used in the logo alt text, the
// order-confirmation message and the personal-data consent declaration.
export const our_office_name = 'ДЖЕНЕРАЛ БРОКЕР КЛУБ ООД';

// Contact details.
export const our_office_email = 'office@general-bg.com';
export const our_office_phone1 = '+359 892 391 959';
export const our_office_phone2 = '+359 899 116 117';
