# Задание 3

	Перед выполнением задания, чтобы лучше разобраться в коде, перевел ES6 в ES5.
	Для ознакомления с ServiceWorker разбирал с документацией и статьями.

	1) Перенести gifs.html и всю папку vendor в папку с service-worker.js, т.к. для корректного определения scope, страницы не будут подконтрольны ServiceWorker'у, если они находятся в директории выше.

	2) При запуске, в Chrome Dev Tools -> Aplication -> Cache, было замечено, что кэш не создается.
	
	3) Предположил, что ошибка на этапе 'instal' - не создается кэш и не кэширует данные.

	4) Закомментировал всю функцию preCacheAllFavorites(), оставил только вызов функции getAllFavorites() и написал простой код, для создание Кэша. Кэш создался. ОК.

	5) Сказал функции getFavoriteById(id), чтобы все images сразу кэшировались.

	6) Удалил функцию preCacheAllFavorites(), в 'instal' сразу вызвал функцию getAllFavorites()

	Проверил. При инсталляции ServiceWorker, создался Кэш с уже существующими избранными гифками.


Ответы на вопросы в задании 3:

	1) При 'instal' вызывается функция preCacheAllFavorites(), не дожидаясь завершения работы функции, в Console выдается сообщение '[ServiceWorker] Installed!', и затем сразу срабаотывает этап 'active'.

	2) Позволяет активному сервис-воркеру начать рабоу без перезагрузки страницы.

	3) Скорее всего нет.

	4) Если версии сервис-воркера различны, удаляет данные из кэша, 

	5) Только один раз возможно отправить request и только один раз можно прочитать response. Из-за этого ограничения мы создаём копии этих объектов.
