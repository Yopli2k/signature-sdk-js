<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
</head>
<body>
<?php

// Muestra toda la informacion, por omision INFO_ALL
phpinfo();

// Mostrar solo la informacion de modulos.
// phpinfo(8) produce el mismo resultado.
phpinfo(INFO_MODULES);

?>
</body>
</html>