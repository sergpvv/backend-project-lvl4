// @ts-check

export default {
  translation: {
    appName: 'Менеджер задач',
    flash: {
      session: {
        create: {
          success: 'Вы залогинены',
          error: 'Неправильный емейл или пароль',
        },
        delete: {
          success: 'Вы разлогинены',
        },
      },
      users: {
        create: {
          error: 'Не удалось зарегистрировать',
          success: 'Пользователь успешно зарегистрирован',
        },
        edit: {
          error: 'Не удалось изменить пользователя',
          success: 'Пользователь успешно изменён',
        },
        delete: {
          success: 'Пользователь успешно удалён',
          error: 'Не удалось удалить пользователя',
        },
        accessDenied: 'Вы не можете редактировать или удалять другого пользователя',
      },
      statuses: {
        create: {
          error: 'Не удалось создать статус',
          success: 'Статус успешно создан',
        },
        edit: {
          error: 'Не удалось изменить статус',
          success: 'Статус успешно изменён',
        },
        delete: {
          success: 'Статус успешно удалён',
          error: 'Не удалось удалить статус',
        },
      },
      tasks: {
        create: {
          error: 'Не удалось создать задачу',
          success: 'Задача успешно создана',
        },
        edit: {
          error: 'Не удалось изменить задачу',
          success: 'Задача успешно изменена',
        },
        delete: {
          success: 'Задача успешно удалена',
          error: 'Не удалось удалить задачу',
          accessDenied: 'Задачу может удалить только её автор',
        },
      },
      labels: {
        create: {
          error: 'Не удалось создать метку',
          success: 'Метка успешно создана',
        },
        edit: {
          error: 'Не удалось изменить метку',
          success: 'Метка успешно изменена',
        },
        delete: {
          success: 'Метка успешно удалена',
          error: 'Не удалось удалить метку',
        },
      },
      authError: 'Доступ запрещён! Пожалуйста, авторизируйтесь.',
    },
    layouts: {
      application: {
        users: 'Пользователи',
        signIn: 'Вход',
        signUp: 'Регистрация',
        signOut: 'Выход',
        statuses: 'Статусы',
        labels: 'Метки',
        tasks: 'Задачи',
      },
    },
    views: {
      actions: 'Действия',
      create: 'Создать',
      save: 'Сохранить',
      delete: 'Удалить',
      edit: 'Изменить',
      id: 'ID',
      name: 'Наименование',
      createdAt: 'Дата создания',
      session: {
        new: {
          submit: 'Войти',
        },
      },
      users: {
        firstName: 'Имя',
        lastName: 'Фамилия',
        fullName: 'Полное имя',
        email: 'Email',
        password: 'Пароль',
        editing: 'Изменение пользователя',
      },
      statuses: {
        create: 'Создать статус',
        creation: 'Создание статуса',
        editing: 'Изменение статуса',
      },
      labels: {
        create: 'Создать метку',
        creation: 'Создание метки',
        editing: 'Изменение метки',
      },
      tasks: {
        description: 'Описание',
        status: 'Статус',
        creator: 'Автор',
        executor: 'Исполнитель',
        create: 'Создать задачу',
        creation: 'Создание задачи',
        editing: 'Изменение задачи',
        label: 'Метка',
        labels: 'Метки',
        myTasksOnly: 'Только мои задачи',
        show: 'Показать',
        accessDenied: 'Задачу может удалить только её автор',
      },
      welcome: {
        index: {
          hello: 'Добро пожаловать!',
          description: 'Простая система управления. Позволяет ставить задачи, назначать исполнителей и менять их статусы.',
        },
      },
    },
  },
};
