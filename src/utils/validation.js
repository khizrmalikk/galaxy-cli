export function validateHexColor(input) {
  const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexRegex.test(input)) {
    return 'Please enter a valid hex color';
  }
  // Ensure it starts with #
  if (!input.startsWith('#')) {
    input = '#' + input;
  }
  return true;
}

export function validateUrl(input) {
  try {
    new URL(input);
    return true;
  } catch {
    return 'Please enter a valid URL';
  }
}

export function validateProjectName(name) {
  const validNameRegex = /^[a-z0-9-]+$/;
  if (!validNameRegex.test(name)) {
    return 'Project name can only contain lowercase letters, numbers, and hyphens';
  }
  if (name.startsWith('-') || name.endsWith('-')) {
    return 'Project name cannot start or end with a hyphen';
  }
  return true;
}
