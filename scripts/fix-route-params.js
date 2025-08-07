#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Find all API route files with dynamic parameters
const routeFiles = glob.sync('src/app/api/**/[*]/route.ts', { 
  cwd: process.cwd(),
  absolute: true 
});

console.log(`Found ${routeFiles.length} API route files with parameters`);

routeFiles.forEach(file => {
  console.log(`Processing: ${path.relative(process.cwd(), file)}`);
  
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Fix GET, POST, PUT, DELETE function parameters
  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  
  httpMethods.forEach(method => {
    const oldPattern = new RegExp(
      `export async function ${method}\\(\\s*request: NextRequest,\\s*\\{ params \\}: \\{ params: \\{ ([^}]+) \\} \\}\\s*\\)`,
      'g'
    );
    
    const newPattern = `export async function ${method}(
  request: NextRequest,
  { params }: { params: Promise<{ $1 }> }
)`;
    
    if (oldPattern.test(content)) {
      content = content.replace(oldPattern, newPattern);
      modified = true;
      console.log(`  - Fixed ${method} method parameters`);
    }
  });
  
  // Fix params usage - add await for Promise resolution
  const paramUsagePattern = /const\s+(\w+)\s*=\s*params\.(\w+);/g;
  let match;
  const paramReplacements = [];
  
  while ((match = paramUsagePattern.exec(content)) !== null) {
    paramReplacements.push({
      original: match[0],
      replacement: `const resolvedParams = await params;\n    const ${match[1]} = resolvedParams.${match[2]};`
    });
  }
  
  if (paramReplacements.length > 0) {
    // Replace in reverse order to maintain positions
    paramReplacements.reverse().forEach(({ original, replacement }) => {
      const index = content.lastIndexOf(original);
      if (index !== -1) {
        content = content.substring(0, index) + replacement + content.substring(index + original.length);
        modified = true;
      }
    });
    console.log(`  - Fixed ${paramReplacements.length} parameter usages`);
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`  ✅ Updated ${path.relative(process.cwd(), file)}`);
  } else {
    console.log(`  ⚪ No changes needed for ${path.relative(process.cwd(), file)}`);
  }
});

console.log('\n✅ Route parameter fixing complete!');