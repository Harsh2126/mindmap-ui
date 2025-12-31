# Interactive Mind Map UI

A production-quality, interactive Mind Map visualization built with React, D3.js, and a data-driven architecture.

Live ---- https://mindmap-ui-91t7.vercel.app/

## Features

### Core Functionality
- **Data-Driven Architecture**: Entire mindmap generated from JSON configuration
- **Interactive Visualization**: Radial node layout with smooth animations
- **Zoom & Pan**: Full viewport control with fit-to-view functionality
- **Expand/Collapse**: Dynamic node expansion with animated transitions

### Interactions
- **Node Selection**: Click to select and view details
- **Hover Effects**: Tooltips and visual feedback
- **Drill Down/Up**: Focus on specific subtrees
- **Live Editing**: Inline editing of node content with XSS protection

### Visual Design
- **Dark Theme**: Professional dark interface with grid background
- **Color Coding**: Level-based node colors (Blue → Green → Orange → Purple)
- **Responsive Layout**: Adapts to different screen sizes
- **Smooth Animations**: D3.js powered transitions

### Toolbar Actions
- Expand All / Collapse All
- Drill Down / Drill Up navigation
- Add Node functionality
- Export as Image (PNG) or JSON

## Tech Stack

- **React 18** with Vite for fast development
- **D3.js v7** for graph rendering and interactions
- **Plain CSS** with dark theme styling
- **JSON-based** data source (no hardcoded content)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/
│   ├── MindMap.jsx      # Main visualization component
│   ├── Node.jsx         # Individual node rendering
│   ├── Sidebar.jsx      # Documentation panel
│   └── Toolbar.jsx      # Action toolbar
├── hooks/
│   └── useMindMapData.js # Data loading and management
├── App.jsx              # Main application component
└── main.jsx             # React entry point

public/
└── mindmap-data.json    # JSON data source
```

## Data Structure

The mindmap is driven by a JSON file with the following structure:

```json
{
  "id": "unique-id",
  "title": "Node Title",
  "summary": "Brief description for tooltips",
  "description": "Detailed description for sidebar",
  "metadata": {
    "notes": "Additional notes",
    "inputs": ["Input 1", "Input 2"],
    "outputs": ["Output 1", "Output 2"]
  },
  "children": [...]
}
```

## Security Features

- **XSS Protection**: All user inputs are sanitized
- **Input Validation**: Length limits and content validation
- **Safe JSON Updates**: Prevents malformed data corruption
- **Secure Exports**: No internal state exposure in downloads

## Key Components

### MindMap.jsx
- D3.js integration for graph rendering
- Radial layout algorithm
- Zoom and pan functionality
- Node positioning and animations

### Sidebar.jsx
- Editable node properties
- Inline editing with save/cancel
- Metadata display
- Input sanitization

### Toolbar.jsx
- Action buttons for mindmap control
- Export functionality
- Navigation controls

### useMindMapData.js
- JSON data loading
- State management
- Node updates and additions
- Export functionality

## Customization

### Adding New Node Types
Modify the JSON structure and update the color scheme in `Node.jsx`:

```javascript
const getNodeColor = (level) => {
  const colors = ['#4a9eff', '#4caf50', '#ff9800', '#9c27b0'];
  return colors[level % colors.length];
};
```

### Changing Layout Algorithm
Update the `calculateLayout` function in `MindMap.jsx` to implement different positioning strategies.

### Styling Modifications
All styling is in component-specific CSS files with CSS custom properties for easy theming.

## Performance Considerations

- Efficient D3.js rendering with minimal DOM manipulation
- Memoized calculations for layout updates
- Optimized re-renders with React.memo where appropriate
- Lazy loading of node details

## Browser Support

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers with touch support for pan/zoom
