/**
 * Lightweight sandbox template renderer.
 * Supports: {{ variable }}, {% if var %}...{% endif %}, {% for item in items %}...{% endfor %}
 * All output is HTML-escaped by default.
 */

const BLOCKED_KEYS = new Set([
  'constructor',
  '__proto__',
  '__defineGetter__',
  '__defineSetter__',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf',
]);

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function resolveValue(obj: Record<string, any>, path: string): unknown {
  const parts = path.trim().split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (BLOCKED_KEYS.has(part)) return undefined;
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object') {
      current = (current as Record<string, any>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

function isTruthy(value: unknown): boolean {
  if (value === null || value === undefined || value === false || value === 0 || value === '') {
    return false;
  }
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function processIfBlocks(template: string, context: Record<string, any>): string {
  // Handle {% if condition %}...{% else %}...{% endif %}
  const ifRegex =
    /\{%\s*if\s+([\w.]+)\s*%\}([\s\S]*?)(?:\{%\s*else\s*%\}([\s\S]*?))?\{%\s*endif\s*%\}/g;

  return template.replace(ifRegex, (_, condition, ifBlock, elseBlock = '') => {
    const value = resolveValue(context, condition);
    return isTruthy(value) ? renderTemplate(ifBlock, context) : renderTemplate(elseBlock, context);
  });
}

function processForBlocks(template: string, context: Record<string, any>): string {
  // Handle {% for item in collection %}...{% endfor %}
  const forRegex = /\{%\s*for\s+(\w+)\s+in\s+([\w.]+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g;

  return template.replace(forRegex, (_, itemName, collectionPath, body) => {
    const collection = resolveValue(context, collectionPath);
    if (!Array.isArray(collection)) return '';

    return collection
      .map((item, index) => {
        const loopContext: Record<string, any> = {
          ...context,
          [itemName]: item,
          loop: {
            index: index + 1,
            index0: index,
            first: index === 0,
            last: index === collection.length - 1,
            length: collection.length,
          },
        };
        return renderTemplate(body, loopContext);
      })
      .join('');
  });
}

function processVariables(template: string, context: Record<string, any>): string {
  // Replace {{ expression }} with HTML-escaped value
  const varRegex = /\{\{\s*([\w.]+)\s*\}\}/g;

  return template.replace(varRegex, (_, expr) => {
    const value = resolveValue(context, expr);
    return escapeHtml(value);
  });
}

export function renderTemplate(template: string, context: Record<string, any>): string {
  // Create a safe context proxy that blocks prototype access
  const safeContext: Record<string, any> = {};
  for (const key of Object.keys(context)) {
    if (BLOCKED_KEYS.has(key)) continue;
    safeContext[key] = context[key];
  }

  let result = template;

  // Process blocks first (they may contain nested variables)
  // Run multiple passes for nested blocks
  let prev = '';
  let maxIterations = 10;
  while (result !== prev && maxIterations-- > 0) {
    prev = result;
    result = processForBlocks(result, safeContext);
    result = processIfBlocks(result, safeContext);
  }

  // Finally process variables
  result = processVariables(result, safeContext);

  return result;
}
