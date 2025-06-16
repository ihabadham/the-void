import { useState, useCallback } from "react";
import { z } from "zod";

/**
 * Simple form validation hook using Zod schemas
 */
export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: Partial<T> = {}
) {
  const [values, setFormValues] = useState<Partial<T>>(initialValues);
  const [errors, setFormErrors] = useState<Record<string, string>>({});
  const [touched, setFormTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate all fields
  const validate = useCallback(() => {
    try {
      schema.parse(values);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join(".");
          if (!newErrors[field]) {
            newErrors[field] = err.message;
          }
        });
        setFormErrors(newErrors);
      }
      return false;
    }
  }, [schema, values]);

  // Update field value
  const setValue = useCallback((name: keyof T, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Mark field as touched
  const setTouched = useCallback((name: keyof T) => {
    setFormTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      setIsSubmitting(true);

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => {
          acc[key] = true;
          return acc;
        },
        {} as Record<string, boolean>
      );
      setFormTouched(allTouched);

      try {
        if (validate()) {
          await onSubmit(values as T);
        }
      } catch (error) {
        console.error("Form submission error:", error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [validate, values]
  );

  // Reset form
  const reset = useCallback(() => {
    setFormValues(initialValues);
    setFormErrors({});
    setFormTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Get field error if touched
  const getFieldError = useCallback(
    (name: keyof T) => {
      return touched[name as string] ? errors[name as string] : undefined;
    },
    [errors, touched]
  );

  // Check if form has errors
  const hasErrors = Object.keys(errors).length > 0;

  // Check if form is dirty
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    hasErrors,
    isDirty,
    setValue,
    setTouched,
    validate,
    handleSubmit,
    reset,
    getFieldError,
  };
}

/**
 * Pre-configured form validation hooks for specific schemas
 */
export const useApplicationFormValidation = (initialValues?: any) => {
  const { formSchemas } = require("../lib/validation/schemas");
  return useFormValidation(formSchemas.application, initialValues);
};

export const useSettingsFormValidation = (initialValues?: any) => {
  const { formSchemas } = require("../lib/validation/schemas");
  return useFormValidation(formSchemas.settings, initialValues);
};
