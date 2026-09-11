/* Version affichée dans l'app ET lue par le service worker (importScripts).
   `self` existe aussi bien dans une page (alias de window) que dans un
   service worker : une seule ligne fonctionne donc dans les deux contextes. */
self.APP_VERSION = '1.1.1';
