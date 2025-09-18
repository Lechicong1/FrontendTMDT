document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const emailOrPhone = document.getElementById('login-email-or-phone').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');

    try {
        const response = await fetch(`${window.Base_Url}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: emailOrPhone.includes('@') ? emailOrPhone : null, 
                phone: emailOrPhone.includes('@') ? null : emailOrPhone, 
                password :password
            })
        });

        const result = await response.json();

        if (result.success) {
            // Lưu token vào localStorage
            localStorage.setItem('authToken', result.data);
            localStorage.setItem('Info',emailOrPhone)
            alert('Đăng nhập thành công! Token đã được lưu.');
            window.location.href = '/index/index.html';
        } else {
            errorElement.textContent = result.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
        }
    } catch (error) {
        errorElement.textContent = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        console.error(error);
    }
});