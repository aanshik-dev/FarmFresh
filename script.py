import re

with open('./Frontend/src/pages/AdminLogin.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace useState for role
code = re.sub(r'const \[role, setRole\] = useState\("FARMER_GROUP"\);', 'const role = "ADMIN";', code)

# Remove SlideToggle import
code = re.sub(r'import SlideToggle from "../components/common/SlideToggle";\n', '', code)

# Remove ROLE_OPTIONS
code = re.sub(r'const ROLE_OPTIONS = \[.*?\];\n\n', '', code, flags=re.DOTALL)

# Remove Role toggle and Admin button UI
code = re.sub(r'\{\/\* Role toggle and Admin button \*\/\}[\s\S]*?\{\/\* Form \*\/\}', '{/* Form */}', code)

# Replace Title
code = re.sub(r'\{role === "ADMIN" \? \([\s\S]*?\) : \([\s\S]*?"Welcome back"[\s\S]*?\)\}', '<><Icon icon="ph:shield-check-fill" className="text-violet-500" /> Admin Login</>', code)

# Replace Subtitle
code = re.sub(r'\{role === "ADMIN"[\s\S]*?\? "Sign in to access the administrator portal"[\s\S]*?: "Sign in to your FarmFresh account"\}', '"Sign in to access the administrator portal"', code)

# Replace placeholders
code = re.sub(r'placeholder=\{[\s\S]*?role === "ADMIN"[\s\S]*?\? "admin@farmfresh.com"[\s\S]*?: role === "FARMER_GROUP"[\s\S]*?\? "farmer@farmfresh.com"[\s\S]*?: "collective@farmfresh.com"[\s\S]*?\}', 'placeholder="admin@farmfresh.com"', code)

# Replace button color class
code = re.sub(r'role === "ADMIN"[\s\S]*?\? "bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 shadow-violet-500\/20"[\s\S]*?: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500\/20"', '"bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 shadow-violet-500/20"', code)

# Remove social login
code = re.sub(r'\{\/\* Social Login Separator \*\/\}[\s\S]*?\{\/\* Google Login Button \*\/\}[\s\S]*?<\/button>\s*<\/>\s*\}', '', code)
code = re.sub(r'\{\s*role !== "ADMIN" && \([\s\S]*?(?:<\/button>|Or continue with)[\s\S]*?<\/>\s*\)\}', '', code)

# Remove register link
code = re.sub(r'<p\s*className=\{\`text-center text-sm mt-5[\s\S]*?Don\'t have an account\?[\s\S]*?<\/p>', '', code)

# Remove remember me
code = re.sub(r'<label className="flex items-center gap-2 cursor-pointer">[\s\S]*?<\/label>', '', code)

# Replace focus ring ternaries
code = re.sub(r'role === "ADMIN"[\s\S]*?\? "focus:ring-violet-500\/40 focus:border-violet-500"[\s\S]*?: "focus:ring-emerald-500\/40 focus:border-emerald-500"', '"focus:ring-violet-500/40 focus:border-violet-500"', code)

# Replace text color ternaries
code = re.sub(r'role === "ADMIN"[\s\S]*?\? "text-violet-400 hover:text-violet-300"[\s\S]*?: "text-emerald-400 hover:text-emerald-300"', '"text-violet-400 hover:text-violet-300"', code)
code = re.sub(r'role === "ADMIN"[\s\S]*?\? "text-violet-500 hover:text-violet-400"[\s\S]*?: "text-emerald-500 hover:text-emerald-400"', '"text-violet-500 hover:text-violet-400"', code)

# Clean up empty spaces and divs
code = code.replace('<div className={`flex justify-between pb-1.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>\n\n                      <button', '<div className={`flex justify-between pb-1.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>\n                      <button')

with open('./Frontend/src/pages/AdminLogin.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('AdminLogin.jsx updated via python script')

with open('./Frontend/src/pages/Login.jsx', 'r', encoding='utf-8') as f:
    login_code = f.read()

# 1. Remove the Admin button next to SlideToggle
login_code = re.sub(r'<button\s*type="button"\s*onClick=\{\(\) =>\s*setRole\(role === "ADMIN" \? "FARMER_GROUP" : "ADMIN"\)\s*\}[\s\S]*?Admin\s*<\/button>', '', login_code)
# Ensure the div wrapper expands
login_code = re.sub(r'<div className="mb-4 flex items-end gap-3">\s*<div className="flex-1">', '<div className="mb-4 flex items-end gap-3">\n                  <div className="w-full">', login_code)

# 2. Simplify header
login_code = re.sub(r'\{role === "ADMIN" \? \([\s\S]*?\) : \([\s\S]*?"Welcome back"[\s\S]*?\)\}', '"Welcome back"', login_code)

# 3. Simplify subtitle
login_code = re.sub(r'\{role === "ADMIN"[\s\S]*?\? "Sign in to access the administrator portal"[\s\S]*?: "Sign in to your FarmFresh account"\}', '"Sign in to your FarmFresh account"', login_code)

# 4. Simplify placeholders
login_code = re.sub(r'placeholder=\{[\s\S]*?role === "ADMIN"[\s\S]*?\? "admin@farmfresh.com"[\s\S]*?: role === "FARMER_GROUP"[\s\S]*?\? "farmer@farmfresh.com"[\s\S]*?: "collective@farmfresh.com"[\s\S]*?\}', 'placeholder={role === "FARMER_GROUP" ? "farmer@farmfresh.com" : "collective@farmfresh.com"}', login_code)

# 5. Remove remember me admin check
login_code = re.sub(r'className=\{\`accent-emerald-400 border-emerald-400 cursor-pointer \$\{role === "ADMIN" \? "hidden" : ""\}\`\}', 'className="accent-emerald-400 border-emerald-400 cursor-pointer"', login_code)
login_code = re.sub(r'<span className=\{role === "ADMIN" \? "hidden" : ""\}>', '<span>', login_code)

# 6. Simplify button classes where role ternaries exist
login_code = re.sub(r'role === "ADMIN"[\s\S]*?\? "focus:ring-blue-500\/40 focus:border-blue-500"[\s\S]*?: "focus:ring-emerald-500\/40 focus:border-emerald-500"', '"focus:ring-emerald-500/40 focus:border-emerald-500"', login_code)

login_code = re.sub(r'role === "ADMIN"[\s\S]*?\? "text-blue-500 hover:text-blue-400"[\s\S]*?: "text-emerald-400 hover:text-emerald-300"', '"text-emerald-400 hover:text-emerald-300"', login_code)

login_code = re.sub(r'role === "ADMIN"[\s\S]*?\? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-blue-500\/20"[\s\S]*?: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500\/20"', '"bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/20"', login_code)

login_code = re.sub(r'role === "ADMIN"[\s\S]*?\? "text-blue-500 hover:text-blue-400"[\s\S]*?: "text-emerald-500 hover:text-emerald-400"', '"text-emerald-500 hover:text-emerald-400"', login_code)

# Remove {role !== "ADMIN" && ( ... )} wrapper around social login
login_code = re.sub(r'\{\s*role !== "ADMIN" && \([\s\S]*?(<div className="flex items-center my-4">[\s\S]*?<\/button>)\s*<\/>\s*\)\}', r'\1', login_code)

with open('./Frontend/src/pages/Login.jsx', 'w', encoding='utf-8') as f:
    f.write(login_code)
    
print('Login.jsx updated via python script')
