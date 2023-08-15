// @ts-check

export default {
  translation: {
    appName: 'Менеджер задач',
    flash: {
      session: {
        create: {
          success: 'Вы залогинены',
          error: 'Неправильный адрес электронной почты или пароль',
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
      authError: 'Доступ запрещён! Пожалуйста, авторизируйтесь.',
      accessDenied: 'Вы не можете редактировать или удалять другого пользователя',
    },
    layouts: {
      application: {
        users: 'Пользователи',
        signIn: 'Вход',
        signUp: 'Регистрация',
        signOut: 'Выход',
        statuses: 'Статусы',
      },
    },
    views: {
      actions: 'Действия',
      create: 'Создать',
      save: 'Сохранить',
      delete: 'Удалить',
      edit: 'Изменить',
      id: 'ID',
      createdAt: 'Дата создания',
      session: {
        new: {
          submit: 'Войти',
        },
      },
      users: {
        firstName: 'Имя',
        lastName: 'Фамилия',
        email: 'Email',
        password: 'Пароль',
        editing: 'Изменение пользователя',
      },
      statuses: {
        name: 'Наименование',
        create: 'Создать статус',
        creation: 'Создание статуса',
        editing: 'Изменение статуса',
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
