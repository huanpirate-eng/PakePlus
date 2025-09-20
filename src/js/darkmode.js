// 深色模式功能
document.addEventListener('DOMContentLoaded', function() {
    // 检查本地存储中的深色模式设置
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // 应用保存的设置
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        updateDarkModeIcon(true);
    }
    
    // 创建深色模式切换按钮
    const darkModeToggle = document.createElement('div');
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.innerHTML = isDarkMode ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
    document.body.appendChild(darkModeToggle);
    
    // 添加点击事件
    darkModeToggle.addEventListener('click', function() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDark);
        updateDarkModeIcon(isDark);
    });
});

// 更新深色模式图标
function updateDarkModeIcon(isDark) {
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.innerHTML = isDark ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    }
}