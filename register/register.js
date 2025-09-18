

window.Base_Url = "http://localhost:8080";

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailOrPhone = document.getElementById('register-email-or-phone').value;
    const password = document.getElementById('register-password').value;
    const errorElement = document.getElementById('register-error');

    try {
        const response = await fetch(`${window.Base_Url}/api/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 

                email: emailOrPhone.includes('@') ? emailOrPhone : null, 
                phone: emailOrPhone.includes('@') ? null : emailOrPhone, 
                password : password
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            window.location.href = '../login/login.html';
        } else {
            errorElement.textContent = result.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        }
    } catch (error) {
        errorElement.textContent = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        console.error(error);
    }
});