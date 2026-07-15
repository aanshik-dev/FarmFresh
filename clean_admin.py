import re

with open('./Frontend/src/pages/AdminLogin.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Replace state
code = code.replace('const [role, setRole] = useState("FARMER_GROUP");', 'const role = "ADMIN";')

# 2. Remove SlideToggle import
code = code.replace('import SlideToggle from "../components/common/SlideToggle";\n', '')

# 3. Remove ROLE_OPTIONS
code = re.sub(r'const ROLE_OPTIONS = \[.*?\];\n\n', '', code, flags=re.DOTALL)

# 4. Remove Role toggle and Admin button UI
code = re.sub(r'\{\/\* Role toggle and Admin button \*\/\}[\s\S]*?\{\/\* Form \*\/\}', '{/* Form */}', code)

# 5. Simplify header and subtitle
# In Login.jsx, header is currently just "Welcome back" (my previous script fixed it for Login)
# Wait, let me check what's actually in AdminLogin.jsx (it's identical to Login.jsx right now)
code = re.sub(r'<h2 className="text-5xl font-extrabold text-white leading-14 mb-4">.*?<span className="text-blue-300">', '<h2 className="text-5xl font-extrabold text-white leading-14 mb-4">\n              The\n              <span className="text-violet-300">', code, flags=re.DOTALL)

# Change all emerald colors to violet
code = code.replace('emerald', 'violet')

# Change background blurs
code = code.replace('bg-white/5', 'bg-violet-400/5')
code = code.replace('bg-blue-400/10', 'bg-violet-400/10')

# Change title
code = code.replace('"Welcome back"', '<><Icon icon="ph:shield-check-fill" className="text-violet-500" /> Admin Login</>')

# Change subtitle
code = code.replace('"Sign in to your FarmFresh account"', '"Sign in to access the administrator portal"')

# Change email placeholder
code = code.replace('placeholder={role === "FARMER_GROUP" ? "farmer@farmfresh.com" : "collective@farmfresh.com"}', 'placeholder="admin@farmfresh.com"')

# Remove social login
# It looks like: {/* Social Login Separator */} ... </button>
code = re.sub(r'\{\/\* Social Login Separator \*\/\}[\s\S]*?<\/button>\s*</div>', '</div>', code)
code = re.sub(r'\{\/\* Social Login Separator \*\/\}[\s\S]*?(?:<\/button>)\n', '', code)

# Remove register link
code = re.sub(r'<p\s*className=\{\`text-center text-sm mt-5[\s\S]*?Don\'t have an account\?[\s\S]*?<\/p>', '', code)

# Remove remember me
code = re.sub(r'<label className="flex items-center gap-2 cursor-pointer">[\s\S]*?<\/label>', '', code)

# Remove the empty flex justify-between div around Remember Me / Forgot Password?
code = code.replace('<div\n                      className={`flex justify-between pb-1.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}\n                    >\n\n                      <button', '<div\n                      className={`flex justify-end pb-1.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}\n                    >\n                      <button')

code = code.replace('<div\n                      className={`flex justify-between pb-1.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}\n                    >', '<div\n                      className={`flex justify-end pb-1.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}\n                    >')


with open('./Frontend/src/pages/AdminLogin.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('AdminLogin.jsx successfully styled to violet')
