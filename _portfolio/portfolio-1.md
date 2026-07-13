---
title: "Integrated Planning and Control for Quadrotor Navigation in Presence of Suddenly Appearing Objects and Disturbances"
excerpt: "An integrated planning-and-control framework that reacts to sudden obstacles and disturbances at 100 Hz, enabling autonomous LiDAR flight at speeds up to 5.86 m/s."
collection: portfolio
permalink: /portfolio/integrated-planning-control/
order: 1
publication_date: "January 2024"
publication_date_iso: "2024-01-01"
publication: "IEEE Robotics and Automation Letters, vol. 9, no. 1, pp. 899–906 (2024)"
paper_url: "https://ieeexplore.ieee.org/document/10238764"
code_url: "https://github.com/hku-mars/IPC"
youtube_url: "" # Paste the full YouTube URL here.
bilibili_url: "" # Paste the full Bilibili URL here.
paper_abstract: >-
  We present IPC, an integrated planning-and-control framework for autonomous quadrotor flight in unknown, dynamic, and disturbed environments. A lightweight A* frontend searches for a local reference path, while a linear model predictive control backend enforces safe-flight-corridor constraints and directly generates control actions at 100 Hz. The optimization takes only 2–3.5 ms, allowing the vehicle to react quickly to suddenly appearing obstacles and reject external disturbances. Real-world LiDAR experiments demonstrate autonomous flight in dense forests at speeds up to 5.86 m/s.
---

{% include research-project.html project=page %}
