const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Файл для хранения комментариев
const COMMENTS_FILE = path.join(__dirname, 'comments.json');

// Функция для чтения комментариев из файла
function readComments() {
    try {
        if (!fs.existsSync(COMMENTS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(COMMENTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения файла комментариев:', error);
        return [];
    }
}

// Функция для записи комментариев в файл
function writeComments(comments) {
    try {
        fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
        return true;
    } catch (error) {
        console.error('Ошибка записи файла комментариев:', error);
        return false;
    }
}

app.get('/api/comments', (req, res) => {
    const comments = readComments();
    res.json(comments);
});

app.get('/api/comments/:user', (req, res) => {
    const { user } = req.params;
    const comments = readComments();
    const userComments = comments.filter(comment => comment.user === user);
    res.json(userComments);
});

app.post('/api/comments', (req, res) => {
    const { text, user } = req.body;
    
    if (!text || !user) {
        return res.status(400).json({ error: 'Текст комментария и пользователь обязательны' });
    }
    
    const comments = readComments();
    
    const newComment = {
        id: Date.now(),
        text: text.trim(),
        date: new Date().toLocaleString('ru-RU'),
        user: user,
        author: 'Анонимный пользователь'
    };
    
    comments.push(newComment);
    
    if (writeComments(comments)) {
        res.status(201).json(newComment);
    } else {
        res.status(500).json({ error: 'Ошибка сохранения комментария' });
    }
});

// Удалить комментарий
app.delete('/api/comments/:id', (req, res) => {
    const { id } = req.params;
    const comments = readComments();
    const initialLength = comments.length;
    
    const filteredComments = comments.filter(comment => comment.id !== parseInt(id));
    
    if (filteredComments.length === initialLength) {
        return res.status(404).json({ error: 'Комментарий не найден' });
    }
    
    if (writeComments(filteredComments)) {
        res.json({ message: 'Комментарий удален' });
    } else {
        res.status(500).json({ error: 'Ошибка удаления комментария' });
    }
});

// Удалить все комментарии пользователя
app.delete('/api/comments/user/:user', (req, res) => {
    const { user } = req.params;
    const comments = readComments();
    const initialLength = comments.length;
    
    const filteredComments = comments.filter(comment => comment.user !== user);
    
    if (filteredComments.length === initialLength) {
        return res.status(404).json({ error: 'Комментарии не найдены' });
    }
    
    if (writeComments(filteredComments)) {
        res.json({ message: `Все комментарии для ${user} удалены` });
    } else {
        res.status(500).json({ error: 'Ошибка удаления комментариев' });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cards.html'));
});

app.get('/cards.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cards.html'));
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Доступно по адресу: http://localhost:${PORT}`);
});