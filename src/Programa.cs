using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace CalendarioAnime
{
    static class Programa
    {
        public const string Nombre = "Calendario Anime";
        public static readonly string Carpeta = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CalendarioAnime");

        [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr valor);
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern IntPtr LoadLibrary(string ruta);

        [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr hwnd, int modo);
        [DllImport("user32.dll")] static extern bool IsIconic(IntPtr hwnd);
        [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr hwnd);

        [STAThread]
        static void Main()
        {
            bool primera;
            using (var instancia = new System.Threading.Mutex(true, "Local\\CalendarioAnime.Instancia", out primera))
            {
                // Solo una ventana: si ya está abierta, se trae al frente.
                if (!primera) { MostrarExistente(); return; }
#if !DESARROLLO
                // El ejecutable normal no acepta opciones del motor inyectadas desde variables de entorno.
                foreach (var variable in new[] { "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "WEBVIEW2_BROWSER_EXECUTABLE_FOLDER",
                    "WEBVIEW2_USER_DATA_FOLDER", "WEBVIEW2_RELEASE_CHANNEL_PREFERENCE", "WEBVIEW2_PIPE_FOR_SCRIPT_DEBUGGER" })
                    Environment.SetEnvironmentVariable(variable, null);
#endif
                try { SetProcessDpiAwarenessContext(new IntPtr(-4)); } catch (EntryPointNotFoundException) { }
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
                Application.ThreadException += (s, e) =>
                    MessageBox.Show("Se produjo un error inesperado.\n\n" + e.Exception.Message, Nombre, MessageBoxButtons.OK, MessageBoxIcon.Error);
                try
                {
                    PrepararBibliotecas();
                    Arrancar();
                }
                catch (Exception e)
                {
                    MessageBox.Show("No se pudo iniciar la aplicación.\n\n" + e.Message, Nombre, MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        static void MostrarExistente()
        {
            var actual = Process.GetCurrentProcess();
            foreach (var p in Process.GetProcessesByName(actual.ProcessName))
            {
                if (p.Id == actual.Id || p.MainWindowHandle == IntPtr.Zero) continue;
                if (IsIconic(p.MainWindowHandle)) ShowWindow(p.MainWindowHandle, 9);
                SetForegroundWindow(p.MainWindowHandle);
                return;
            }
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        static void Arrancar() { Application.Run(new Ventana()); }

        // Las bibliotecas de WebView2 viajan dentro del ejecutable y se extraen una vez.
        // En cada arranque se compara su huella SHA-256 con la copia incrustada; si no coincide, se restaura.
        static void PrepararBibliotecas()
        {
            var ensamblado = Assembly.GetExecutingAssembly();
            var destino = Path.Combine(Carpeta, "bin", ensamblado.ManifestModule.ModuleVersionId.ToString("N").Substring(0, 8));
            Directory.CreateDirectory(destino);
            using (var sha = System.Security.Cryptography.SHA256.Create())
                foreach (var nombre in new[] { "Microsoft.Web.WebView2.Core.dll", "Microsoft.Web.WebView2.WinForms.dll", "WebView2Loader.dll" })
                {
                    byte[] original;
                    using (var origen = ensamblado.GetManifestResourceStream("lib/" + nombre))
                    using (var memoria = new MemoryStream()) { origen.CopyTo(memoria); original = memoria.ToArray(); }
                    var ruta = Path.Combine(destino, nombre);
                    if (File.Exists(ruta) && sha.ComputeHash(File.ReadAllBytes(ruta)).SequenceEqual(sha.ComputeHash(original))) continue;
                    File.WriteAllBytes(ruta + ".tmp", original);
                    if (File.Exists(ruta)) File.Delete(ruta);
                    File.Move(ruta + ".tmp", ruta);
                }
            foreach (var antigua in Directory.GetDirectories(Path.Combine(Carpeta, "bin")))
                if (!string.Equals(antigua, destino, StringComparison.OrdinalIgnoreCase))
                    try { Directory.Delete(antigua, true); } catch (IOException) { } catch (UnauthorizedAccessException) { }
            LoadLibrary(Path.Combine(destino, "WebView2Loader.dll"));
            AppDomain.CurrentDomain.AssemblyResolve += (s, e) =>
            {
                var ruta = Path.Combine(destino, new AssemblyName(e.Name).Name + ".dll");
                return File.Exists(ruta) ? Assembly.LoadFrom(ruta) : null;
            };
        }
    }

    sealed class Ventana : Form
    {
        const string Origen = "https://app.calendario/";
        static readonly string[] HostsPermitidos = { "myanimelist.net", "api.jikan.moe" };
        WebView2 web = new WebView2();
        readonly string rutaVentana = Path.Combine(Programa.Carpeta, "ventana.txt");
        readonly string rutaDatos = Path.Combine(Programa.Carpeta, "datos.json");
#if DESARROLLO
        readonly string carpetaDesarrollo = Environment.GetEnvironmentVariable("CALENDARIO_WEB");
#else
        readonly string carpetaDesarrollo = null;
#endif
        readonly HttpClient cliente;
        readonly JavaScriptSerializer json = new JavaScriptSerializer { MaxJsonLength = 32000000 };

        [DllImport("dwmapi.dll")] static extern int DwmSetWindowAttribute(IntPtr hwnd, int atributo, ref int valor, int tamano);

        public Ventana()
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            cliente = new HttpClient(new HttpClientHandler { AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate });
            cliente.Timeout = TimeSpan.FromSeconds(20);
            cliente.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) CalendarioAnime/2.0");

            Text = Programa.Nombre;
            BackColor = Color.FromArgb(11, 14, 19);
            MinimumSize = new Size(760, 560);
            StartPosition = FormStartPosition.Manual;
            using (var icono = Assembly.GetExecutingAssembly().GetManifestResourceStream("calendario.ico"))
                if (icono != null) Icon = new Icon(icono);
            RestaurarVentana();

            web.Dock = DockStyle.Fill;
            web.DefaultBackgroundColor = BackColor;
            Controls.Add(web);
            Load += async (s, e) => await IniciarWeb();
            FormClosing += (s, e) => GuardarVentana();
        }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            int oscuro = 1, color = 0x00130E0B;
            DwmSetWindowAttribute(Handle, 20, ref oscuro, 4);
            DwmSetWindowAttribute(Handle, 35, ref color, 4);
        }

        void RestaurarVentana()
        {
            var area = Screen.PrimaryScreen.WorkingArea;
            var preferida = new Rectangle(area.X + area.Width / 10, area.Y + area.Height / 12, area.Width * 8 / 10, area.Height * 10 / 12);
            bool maximizada = false;
            try
            {
                var p = File.ReadAllText(rutaVentana).Split('|').Select(x => int.Parse(x, CultureInfo.InvariantCulture)).ToArray();
                var guardada = new Rectangle(p[0], p[1], Math.Max(p[2], MinimumSize.Width), Math.Max(p[3], MinimumSize.Height));
                var pantalla = Screen.AllScreens.Select(x => x.WorkingArea)
                    .OrderByDescending(x => { var i = Rectangle.Intersect(x, guardada); return i.Width * i.Height; }).First();
                var visible = Rectangle.Intersect(pantalla, guardada);
                if (visible.Width > 120 && visible.Height > 80)
                {
                    int ancho = Math.Min(guardada.Width, pantalla.Width), alto = Math.Min(guardada.Height, pantalla.Height);
                    preferida = new Rectangle(Math.Max(pantalla.Left, Math.Min(guardada.Left, pantalla.Right - ancho)),
                        Math.Max(pantalla.Top, Math.Min(guardada.Top, pantalla.Bottom - alto)), ancho, alto);
                }
                maximizada = p[4] == 1;
            }
            catch (Exception) { }
            Bounds = preferida;
            if (maximizada) WindowState = FormWindowState.Maximized;
        }

        void GuardarVentana()
        {
            var r = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
            try
            {
                Directory.CreateDirectory(Programa.Carpeta);
                File.WriteAllText(rutaVentana, string.Join("|", r.X, r.Y, r.Width, r.Height, WindowState == FormWindowState.Maximized ? 1 : 0));
            }
            catch (IOException) { }
        }

        async Task IniciarWeb()
        {
            CoreWebView2Environment entorno = null;
            try
            {
                // Si una ventana anterior aún está cerrando su motor, se espera un poco y se reintenta.
                for (int intento = 1; ; intento++)
                {
                    bool fallo = false;
                    try
                    {
                        entorno = await CoreWebView2Environment.CreateAsync(null, Path.Combine(Programa.Carpeta, "WebView2"));
                        await web.EnsureCoreWebView2Async(entorno);
                    }
                    catch (COMException ex)
                    {
                        if (intento >= 6) throw new InvalidOperationException(
                            "El motor de la ventana sigue ocupado por una ejecución anterior. Espera unos segundos y vuelve a abrir la aplicación.", ex);
                        fallo = true;
                    }
                    if (!fallo) break;
                    Controls.Remove(web);
                    web.Dispose();
                    web = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = BackColor };
                    Controls.Add(web);
                    await Task.Delay(1500);
                }
            }
            catch (InvalidOperationException ex)
            {
                MessageBox.Show(ex.Message, Programa.Nombre, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                Close();
                return;
            }
            catch (WebView2RuntimeNotFoundException)
            {
                if (MessageBox.Show("Falta Microsoft Edge WebView2 Runtime, incluido normalmente en Windows 11.\n¿Quieres abrir la página de descarga oficial?",
                    Programa.Nombre, MessageBoxButtons.YesNo, MessageBoxIcon.Warning) == DialogResult.Yes)
                    Abrir("https://developer.microsoft.com/microsoft-edge/webview2/");
                Close();
                return;
            }
            var core = web.CoreWebView2;
            bool desarrollo = !string.IsNullOrEmpty(carpetaDesarrollo);
            core.Settings.AreDevToolsEnabled = desarrollo;
            core.Settings.AreDefaultContextMenusEnabled = desarrollo;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.IsGeneralAutofillEnabled = false;
            core.Settings.IsPasswordAutosaveEnabled = false;
            core.AddWebResourceRequestedFilter(Origen + "*", CoreWebView2WebResourceContext.All);
            core.WebResourceRequested += (s, e) => ServirArchivo(entorno, e);
            core.NewWindowRequested += (s, e) => { e.Handled = true; Abrir(e.Uri); };
            core.NavigationStarting += (s, e) =>
            {
                if (!e.Uri.StartsWith(Origen, StringComparison.OrdinalIgnoreCase)) { e.Cancel = true; Abrir(e.Uri); }
            };
            core.WebMessageReceived += async (s, e) => await Atender(e.WebMessageAsJson);
            core.Navigate(Origen + "index.html");
        }

        void ServirArchivo(CoreWebView2Environment entorno, CoreWebView2WebResourceRequestedEventArgs e)
        {
            var ruta = new Uri(e.Request.Uri).AbsolutePath.TrimStart('/');
            if (ruta == "") ruta = "index.html";
            byte[] datos = null;
            if (!string.IsNullOrEmpty(carpetaDesarrollo))
            {
                var archivo = Path.GetFullPath(Path.Combine(carpetaDesarrollo, ruta));
                var raiz = Path.GetFullPath(carpetaDesarrollo).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
                if (archivo.StartsWith(raiz, StringComparison.OrdinalIgnoreCase) && File.Exists(archivo))
                    datos = File.ReadAllBytes(archivo);
            }
            else
            {
                using (var recurso = Assembly.GetExecutingAssembly().GetManifestResourceStream("web/" + ruta))
                    if (recurso != null) { var m = new MemoryStream(); recurso.CopyTo(m); datos = m.ToArray(); }
            }
            if (datos == null) { e.Response = entorno.CreateWebResourceResponse(null, 404, "Not Found", ""); return; }
            string tipo;
            switch (Path.GetExtension(ruta).ToLowerInvariant())
            {
                case ".html": tipo = "text/html; charset=utf-8"; break;
                case ".css": tipo = "text/css; charset=utf-8"; break;
                case ".js": tipo = "text/javascript; charset=utf-8"; break;
                case ".svg": tipo = "image/svg+xml"; break;
                case ".png": tipo = "image/png"; break;
                default: tipo = "application/octet-stream"; break;
            }
            e.Response = entorno.CreateWebResourceResponse(new MemoryStream(datos), 200, "OK",
                "Content-Type: " + tipo + "\r\nCache-Control: no-cache");
        }

        async Task Atender(string mensaje)
        {
            var peticion = json.DeserializeObject(mensaje) as Dictionary<string, object>;
            if (peticion == null) return;
            object id;
            peticion.TryGetValue("id", out id);
            var respuesta = new Dictionary<string, object> { { "id", id } };
            try
            {
                switch (Convert.ToString(peticion["tipo"]))
                {
                    case "leer":
                        respuesta["valor"] = File.Exists(rutaDatos) ? File.ReadAllText(rutaDatos, Encoding.UTF8) : "";
                        break;
                    case "guardar":
                        Directory.CreateDirectory(Programa.Carpeta);
                        File.WriteAllText(rutaDatos + ".tmp", Convert.ToString(peticion["valor"]), new UTF8Encoding(false));
                        if (File.Exists(rutaDatos)) File.Replace(rutaDatos + ".tmp", rutaDatos, null);
                        else File.Move(rutaDatos + ".tmp", rutaDatos);
                        break;
                    case "abrir":
                        Abrir(Convert.ToString(peticion["url"]));
                        break;
                    case "http":
                        var url = new Uri(Convert.ToString(peticion["url"]));
                        if (url.Scheme != "https" || !HostsPermitidos.Any(h => url.Host == h || url.Host.EndsWith("." + h)))
                            throw new InvalidOperationException("Dirección no permitida.");
                        using (var r = await cliente.GetAsync(url))
                        {
                            respuesta["estado"] = (int)r.StatusCode;
                            respuesta["cuerpo"] = await r.Content.ReadAsStringAsync();
                        }
                        break;
                }
            }
            catch (Exception ex)
            {
                respuesta["error"] = ex is TaskCanceledException ? "La conexión tardó demasiado." :
                    ex is HttpRequestException ? "No se pudo conectar." : ex.Message;
            }
            if (web.CoreWebView2 != null) web.CoreWebView2.PostWebMessageAsJson(json.Serialize(respuesta));
        }

        static void Abrir(string url)
        {
            Uri uri;
            if (Uri.TryCreate(url, UriKind.Absolute, out uri) && (uri.Scheme == "https" || uri.Scheme == "http"))
                try { Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true }); } catch (Exception) { }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing) { web.Dispose(); cliente.Dispose(); }
            base.Dispose(disposing);
        }
    }
}
