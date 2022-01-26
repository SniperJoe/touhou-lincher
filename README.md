# Touhou Lincher
Touhou (Re-)Launcher port for Debian-based GNU/Linux systems

## Additional features
+ Wine settings (can be set as global as for separate games)
  + Setting up which Wine executable to use\
  The program will look for Wine and Steam Proton automatically at first launch

  + Setting up which Wine prefix to use

+ Both Windows-native (np21nt.exe) and Linux-native (xnp21kai) Neko Project support

+ Specifying commands to execute before and after game runs

+ Finally a good internal browser to explore replays web sites 😄

## Used technologies
+ [Electron](https://github.com/electron/electron)
+ [Vue.js](https://github.com/vuejs/vue)
+ [Quasar](https://github.com/quasarframework/quasar)
---
<details><summary>
Possible Q&A
</summary><div>

- Q: I can't see the launcher's icon in menu\
A: This is beacause of a known electron bug: [https://github.com/trezor/trezor-suite/issues/3395](https://github.com/trezor/trezor-suite/issues/3395). It's fix is still in progress. 

- Q: Can I add a translation of the program to my language?\
A: Feel free to create a pull request. All translations are on top of .vue files. The format is pretty straight-forward, but if you have problems, you can always contact me via email pointed in the program's info and I will send you clear strings to be translated. 

- Q: A running WebKit examplar just for runnning Touhou Games? U MAD?\
A: This program contains not so much "background" logic and the most of work is building the UI. Nowadays all of ways of building UI are far less perfect than web front-end tools. Dealing with event-based UI technologies is pretty painful and requires more care about details and more time as the result. After all, we all want faster features delivery, right? 🙃

</div></details>

---

All feature & bug fix requests are welcome. You can [open an issue](https://github.com/SniperJoe/touhou-lincher/issues) or contact me via email pointed in the program's info.
