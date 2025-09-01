# Lookup Component Refactoring

This document outlines the refactoring of the large `Lookup.js` component into smaller, more manageable components following Next.js best practices.

## Problem
The original `Lookup.js` file was 573 lines long and handled multiple responsibilities:
- TMDB search functionality (movies and TV shows)
- File exploration and selection
- Proposed changes generation and application
- UI state management for multiple tabs and forms

## Solution
The component has been broken down into the following structure:

### File Structure
```
web/
├── components/
│   ├── Lookup.js (original - 573 lines)
│   ├── LookupNew.js (refactored main component - ~150 lines)
│   └── lookup/
│       ├── index.js
│       ├── TMDBSearch.js
│       ├── MovieSearch.js
│       ├── TVSearch.js
│       ├── TMDBResults.js
│       ├── FileExplorer.js
│       └── ProposedChanges.js
└── hooks/
    ├── index.js
    ├── useTMDBSearch.js
    └── useFileOperations.js
```

### Components Breakdown

#### 1. **LookupNew.js** (~150 lines)
- Main orchestrator component
- Handles state coordination between different parts
- Manages the overall layout and data flow

#### 2. **TMDBSearch.js** (~65 lines)
- Container for TMDB search functionality
- Manages tabs between movie and TV search
- Coordinates search operations

#### 3. **MovieSearch.js** (~45 lines)
- Handles movie-specific search form
- Includes title and year fields
- Focused single responsibility

#### 4. **TVSearch.js** (~55 lines)
- Handles TV show-specific search form
- Includes title, year, and season fields
- Focused single responsibility

#### 5. **TMDBResults.js** (~95 lines)
- Displays search results from TMDB
- Handles result selection
- Shows episode information for TV shows

#### 6. **FileExplorer.js** (~85 lines)
- Manages file listing and selection
- Handles directory refresh
- Shows loading states

#### 7. **ProposedChanges.js** (~70 lines)
- Displays current selections
- Shows proposed file rename changes
- Handles change application

### Custom Hooks

#### 1. **useTMDBSearch.js** (~75 lines)
- Encapsulates all TMDB search logic
- Manages search state and results
- Provides clean API for search operations

#### 2. **useFileOperations.js** (~85 lines)
- Handles file loading and selection
- Manages file operation state
- Provides file manipulation functions

## Benefits of This Refactoring

### 1. **Single Responsibility Principle**
Each component now has a single, well-defined responsibility:
- `MovieSearch` only handles movie search forms
- `FileExplorer` only handles file operations
- `TMDBResults` only displays results

### 2. **Improved Maintainability**
- Smaller files are easier to understand and modify
- Changes to one feature don't affect others
- Easier to locate specific functionality

### 3. **Better Testability**
- Each component can be tested in isolation
- Custom hooks can be tested independently
- Mocking dependencies is simpler

### 4. **Enhanced Reusability**
- Components can be reused in other parts of the application
- Hooks can be shared across components
- Clear interfaces make integration easier

### 5. **Better Developer Experience**
- Faster file loading in IDE
- Better code navigation
- Easier code reviews

### 6. **Performance Benefits**
- React can optimize smaller components better
- Reduced bundle size through tree shaking
- Better memoization opportunities

## Migration Guide

To use the refactored version:

1. **Replace the import:**
   ```javascript
   // Old
   import Lookup from './components/Lookup';
   
   // New
   import Lookup from './components/LookupNew';
   ```

2. **Or rename the files:**
   - Rename `Lookup.js` to `LookupOld.js` (backup)
   - Rename `LookupNew.js` to `Lookup.js`

3. **Update any tests** to import from the new component structure

## Next.js Best Practices Applied

1. **Component Composition**: Breaking down complex components into smaller, composable pieces
2. **Custom Hooks**: Extracting stateful logic into reusable hooks
3. **Clear File Structure**: Organizing related components in subdirectories
4. **Index Files**: Providing clean import paths
5. **Single File Exports**: Each file has a default export with a clear purpose

## Future Improvements

1. **Add PropTypes or TypeScript** for better type safety
2. **Add unit tests** for each component and hook
3. **Consider React.memo** for performance optimization
4. **Add Storybook stories** for component documentation
5. **Extract constants** into separate configuration files
