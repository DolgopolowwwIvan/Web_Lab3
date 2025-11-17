document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = window.location.origin + '/api';
    
    console.log('API Base URL:', API_BASE); 
    
    // Инициализация всех блоков комментариев
    initCommentsSections();
    
    function initCommentsSections() {
        const commentsSections = document.querySelectorAll('.comments-section');
        
        commentsSections.forEach(section => {
            const user = section.getAttribute('data-user');
            initCommentsSection(section, user);
        });
    }
    
    function initCommentsSection(section, user) {
        const textarea = section.querySelector('textarea');
        const addCommentBtn = section.querySelector('.add-comment');
        const commentsList = section.querySelector('.comments-list');
        const clearBtn = section.querySelector('.clear-comments');
        const exportBtn = section.querySelector('.export-comments');
        
        loadComments(user, commentsList);
        
        addCommentBtn.addEventListener('click', function() {
            const text = textarea.value.trim();
            
            if (text === '') {
                showNotification('Комментарий не может быть пустым', 'error', section);
                return;
            }
            
            addComment(text, user, commentsList, section);
            textarea.value = '';
        });
        
        clearBtn.addEventListener('click', function() {
            if (confirm(`Вы уверены, что хотите удалить все комментарии для ${user === 'Nikita' ? 'Никиты' : 'Ивана'}?`)) {
                clearAllComments(user, commentsList, section);
            }
        });
       
        exportBtn.addEventListener('click', function() {
            exportCommentsJson(user, section);
        });
    }
    
    async function loadComments(user, commentsList) {
        try {
            const response = await fetch(`${API_BASE}/comments/${user}`);
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки комментариев');
            }
            
            const comments = await response.json();
            displayComments(comments, commentsList, user);
            
        } catch (error) {
            console.error('Ошибка:', error);
            commentsList.innerHTML = '<p class="empty-comments">Ошибка загрузки комментариев</p>';
        }
    }
    
    // Функция отображения комментариев
    function displayComments(comments, commentsList, user) {
        commentsList.innerHTML = '';
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p class="empty-comments">Пока нет комментариев. Будьте первым!</p>';
            return;
        }
        
        comments.sort((a, b) => b.id - a.id);
        
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">${comment.date}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
                <div class="comment-actions">
                    <button class="delete-comment" data-id="${comment.id}">Удалить</button>
                </div>
            `;
            
            commentsList.appendChild(commentElement);
        });
        
        commentsList.querySelectorAll('.delete-comment').forEach(button => {
            button.addEventListener('click', function() {
                const commentId = this.getAttribute('data-id');
                deleteComment(commentId, user, commentsList, commentsList.closest('.comments-section'));
            });
        });
    }
    
    // Функция добавления комментария на сервер
    async function addComment(text, user, commentsList, section) {
        try {
            const response = await fetch(`${API_BASE}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    user: user
                })
            });
            
            if (!response.ok) {
                throw new Error('Ошибка добавления комментария');
            }
            
            const newComment = await response.json();
            showNotification('Комментарий успешно добавлен', 'success', section);
            loadComments(user, commentsList);
            
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Ошибка добавления комментария', 'error', section);
        }
    }
    
    // Функция удаления комментария
    async function deleteComment(id, user, commentsList, section) {
        try {
            const response = await fetch(`${API_BASE}/comments/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Ошибка удаления комментария');
            }
            
            showNotification('Комментарий удален', 'success', section);
            loadComments(user, commentsList);
            
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Ошибка удаления комментария', 'error', section);
        }
    }
    
    // Функция удаления всех комментариев пользователя
    async function clearAllComments(user, commentsList, section) {
        try {
            const response = await fetch(`${API_BASE}/comments/user/${user}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Ошибка удаления комментариев');
            }
            
            showNotification('Все комментарии удалены', 'success', section);
            loadComments(user, commentsList);
            
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Ошибка удаления комментариев', 'error', section);
        }
    }
    
    async function exportCommentsJson(user, section) {
        try {
            const response = await fetch(`${API_BASE}/comments/${user}`);
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки комментариев');
            }
            
            const comments = await response.json();
            
            if (comments.length === 0) {
                showNotification('Нет комментариев для экспорта', 'error', section);
                return;
            }
            
            const exportData = {
                database: {
                    name: `comments_database_${user}`,
                    version: "1.0",
                    type: "NoSQL",
                    created: new Date().toISOString()
                },
                metadata: {
                    user: user,
                    userName: user === 'Nikita' ? 'Никита' : 'Иван',
                    exportDate: new Date().toLocaleString('ru-RU'),
                    totalComments: comments.length,
                    exportFormat: "JSON"
                },
                comments: comments
            };
            
            const jsonText = JSON.stringify(exportData, null, 2);
            
            // Создание файла для скачивания
            const blob = new Blob([jsonText], { type: 'application/json; charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comments_database_${user}_${new Date().getTime()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('Комментарии экспортированы в JSON базу данных', 'success', section);
            
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Ошибка экспорта комментариев', 'error', section);
        }
    }
    
    // Функция показа уведомлений
    function showNotification(message, type, section) {
        const existingNotification = section.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const commentForm = section.querySelector('.comment-form');
        commentForm.parentNode.insertBefore(notification, commentForm.nextSibling);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
});