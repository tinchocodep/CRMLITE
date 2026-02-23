import { useRef, useCallback, useState } from 'react';

/**
 * Prevents duplicate form submissions (double-click protection).
 *
 * Usage:
 *   const { isSubmitting, withGuard } = useSubmitGuard();
 *
 *   const handleSubmit = () => withGuard(async () => {
 *     await createSomething(formData);
 *   });
 *
 *   <button disabled={isSubmitting} onClick={handleSubmit}>
 *     {isSubmitting ? 'Guardando...' : 'Guardar'}
 *   </button>
 *
 * @param {number} cooldownMs - Extra cooldown after completion before re-enabling (default 800ms)
 */
export const useSubmitGuard = (cooldownMs = 800) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Use a ref for the synchronous check so concurrent calls see the updated value
    // immediately (before React batches the state update)
    const isSubmittingRef = useRef(false);

    const withGuard = useCallback(async (asyncFn) => {
        // Synchronous guard — prevents parallel executions even within the same tick
        if (isSubmittingRef.current) return null;

        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            return await asyncFn();
        } finally {
            // Keep button disabled for cooldownMs after completion to absorb rapid re-clicks
            setTimeout(() => {
                isSubmittingRef.current = false;
                setIsSubmitting(false);
            }, cooldownMs);
        }
    }, [cooldownMs]);

    return { isSubmitting, withGuard };
};
