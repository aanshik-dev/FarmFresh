const fs = require('fs');
let code = fs.readFileSync('./Frontend/src/pages/AdminLogin.jsx', 'utf8');

// 1. Remove ROLE_OPTIONS
code = code.replace(/const ROLE_OPTIONS = \[[\s\S]*?\];/m, '');

// 2. Remove role toggle and Admin button
code = code.replace(/\{\/\* Role toggle and Admin button \*\/\}[\s\S]*?\{\/\* Form \*\/\}/m, '{/* Form */}');

// 3. Remove Social Login Separator and Google Login Button
code = code.replace(/\{\/\* Social Login Separator \*\/\}[\s\S]*?\{\/\* Google Login Button \*\/\}[\s\S]*?<\/button>\s*<\/>\s*\)}/m, '');

// 4. Remove Register link
code = code.replace(/<p\s*className=\{\	ext-center text-sm mt-5[\s\S]*?<\/p>/m, '');

// 5. Remove 'Remember me'
code = code.replace(/<label className="flex items-center gap-2 cursor-pointer">[\s\S]*?<\/label>/m, '');

// 6. Simplify Header
code = code.replace(/\{role === "ADMIN" \? \([\s\S]*?\) : \([\s\S]*?\)\}/m, '<><Icon icon="ph:shield-check-fill" className="text-violet-500" /> Admin Login</>');

code = code.replace(/\{role === "ADMIN"[\s\S]*?\? "Sign in to access the administrator portal"[\s\S]*?: "Sign in to your FarmFresh account"\}/m, '"Sign in to access the administrator portal"');

// 7. Simplify placeholders
code = code.replace(/placeholder=\{[\s\S]*?\}/m, 'placeholder="admin@farmfresh.com"');

// 8. Simplify button classes where role ternaries exist
code = code.replace(/role === "ADMIN"[\s\S]*?\? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500\/20"[\s\S]*?: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500\/20"/m, '"bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 shadow-violet-500/20"');

// Actually wait, let's just write to file and I will manually multi_replace what is left.
fs.writeFileSync('./Frontend/src/pages/AdminLogin.jsx', code);
console.log('Cleaned admin login');
