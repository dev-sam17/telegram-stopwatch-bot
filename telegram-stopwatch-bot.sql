

CREATE TABLE `stopwatch_sessions` (
  `session_id` int NOT NULL,
  `timer_id` int DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `stop_time` datetime DEFAULT NULL,
  `status` enum('running','stopped','reset') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `timers` (
  `timer_id` int NOT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `isPaused` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
ALTER TABLE `stopwatch_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `timer_id` (`timer_id`);

ALTER TABLE `timers`
  ADD PRIMARY KEY (`timer_id`);

--
ALTER TABLE `stopwatch_sessions`
  MODIFY `session_id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `timers`
  MODIFY `timer_id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `stopwatch_sessions`
  ADD CONSTRAINT `stopwatch_sessions_ibfk_1` FOREIGN KEY (`timer_id`) REFERENCES `timers` (`timer_id`);
COMMIT;

