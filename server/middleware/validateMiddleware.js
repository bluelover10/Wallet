/**
 * Generic Zod validation middleware factory.
 * Usage: router.post('/', validate(schema), controllerFn)
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    return res.status(400).json({ message: message || 'Validation failed' });
  }

  req.body = result.data;
  next();
};

export default validate;
