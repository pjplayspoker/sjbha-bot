import { z } from 'zod';
import { DateTime } from 'luxon';

/** 
 * Converts a string to a number for when a user passes it in as an option
 */
export const number = z.string ()
  .regex (/^\d+$/, 'Not a valid number')
  .transform (Number);


/**
 * Converts a UTC ISO timestamp string to a luxon DateTime
 * Use this with `date.toISOString()` (vanilla JS)
 */
export const timestamp = z.string ()
  .transform (val => DateTime.fromISO (val))
  .refine (d => d.isValid, d => ({ message: `'${d}' is not a valid date` }));


/**
 * Retrieve the error messages from a zod error list
 */
export function formatErrors<T>(errors: z.ZodError<T>) : string[] {
  return errors.errors.map (error => {
    switch (error.code) {
      case z.ZodIssueCode.invalid_type: 
        if (error.received === 'undefined') {
          return `${error.path[0]} is required but is missing`;
        }

        break;
    }

    return error.message;
  });
}