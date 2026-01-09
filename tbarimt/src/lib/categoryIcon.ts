// Function to convert PNG filenames to emojis
export function getCategoryIcon(icon: string | undefined | null): string {
  if (!icon) return '📁';
  
  // If it's already an emoji (doesn't contain .png), return as is
  if (!icon.toLowerCase().endsWith('.png')) {
    return icon;
  }
  
  // Extract filename without extension and convert to lowercase
  const filename = icon.toLowerCase().replace('.png', '').trim();
  
  // Map PNG filenames to emojis
  const iconMap: { [key: string]: string } = {
    'game': '🎮',
    'software': '💻',
    'graphic': '🎨',
    'bichig barimt': '📄',
    'bichigbarimt': '📄',
    'document': '📄',
    'education': '📚',
    'learning': '📚',
    'project': '📋',
    'template': '📋',
    'music': '🎵',
    'phone': '📱',
    'mobile': '📱',
  };
  
  // Check if we have a direct match
  if (iconMap[filename]) {
    return iconMap[filename];
  }
  
  // Check for partial matches
  if (filename.includes('game') || filename.includes('togloom')) {
    return '🎮';
  }
  if (filename.includes('software') || filename.includes('program')) {
    return '💻';
  }
  if (filename.includes('graphic') || filename.includes('design')) {
    return '🎨';
  }
  if (filename.includes('bichig') || filename.includes('barimt') || filename.includes('document')) {
    return '📄';
  }
  if (filename.includes('education') || filename.includes('learning') || filename.includes('hicheel')) {
    return '📚';
  }
  if (filename.includes('project') || filename.includes('template') || filename.includes('tosol')) {
    return '📋';
  }
  if (filename.includes('music') || filename.includes('duu')) {
    return '🎵';
  }
  if (filename.includes('phone') || filename.includes('mobile') || filename.includes('gar utas')) {
    return '📱';
  }
  
  // Default fallback
  return '📁';
}

