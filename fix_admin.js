const fs = require('fs');
let code = fs.readFileSync('./Frontend/src/pages/AdminLogin.jsx', 'utf8');

code = code.replace(/const \[role, setRole\] = useState\("FARMER_GROUP"\);/g, 'const role = "ADMIN";');

// Re-apply violet theme to AdminLogin
code = code.replace(/bg-blue-500/g, 'bg-violet-600');
code = code.replace(/border-blue-400/g, 'border-violet-500');
code = code.replace(/shadow-blue-500\/20/g, 'shadow-violet-500/20');
code = code.replace(/hover:text-blue-400/g, 'hover:text-violet-400');
code = code.replace(/hover:border-blue-500\/50/g, 'hover:border-violet-500/50');
code = code.replace(/hover:text-blue-600/g, 'hover:text-violet-600');
code = code.replace(/hover:border-blue-300/g, 'hover:border-violet-300');
code = code.replace(/focus:ring-blue-500\/40/g, 'focus:ring-violet-500/40');
code = code.replace(/focus:border-blue-500/g, 'focus:border-violet-500');
code = code.replace(/text-blue-500/g, 'text-violet-500');
code = code.replace(/text-blue-300/g, 'text-violet-300');
code = code.replace(/bg-blue-400\/10/g, 'bg-violet-400/10');
code = code.replace(/from-blue-500/g, 'from-violet-500');
code = code.replace(/to-blue-600/g, 'to-violet-600');
code = code.replace(/hover:from-blue-400/g, 'hover:from-violet-400');
code = code.replace(/hover:to-blue-500/g, 'hover:to-violet-500');
code = code.replace(/text-blue-400/g, 'text-violet-400');

fs.writeFileSync('./Frontend/src/pages/AdminLogin.jsx', code);
console.log('Done replacing theme in AdminLogin.jsx');
