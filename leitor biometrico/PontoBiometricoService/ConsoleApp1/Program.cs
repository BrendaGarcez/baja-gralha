using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using DPFP;
using DPFP.Capture;
using DPFP.Processing;

namespace PontoBiometricoLocalService
{
    internal class Program : DPFP.Capture.EventHandler
    {
        private static Capture? capturer = null;
        private static string? ultimaBiometriaBase64 = null;
        private static bool dedoPresente = false;

        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            Program p = new Program();

            Console.WriteLine("=============================================");
            Console.WriteLine("  SERVIÇO BIOMÉTRICO LOCAL (U.are.U 4000B)");
            Console.WriteLine("=============================================");

            try
            {
                // Lista leitores conectados
                ReadersCollection readers = new ReadersCollection();
                Console.WriteLine($"[SDK] Leitores físicos encontrados: {readers.Count}");
                foreach (var key in readers.Keys)
                {
                    var r = readers[(Guid)key];
                    Console.WriteLine($"[SDK] - Produto: {r.ProductName} | Serial: {r.SerialNumber}");
                }

                // Priority.Low permite captura em segundo plano (sem exigir foco exclusivo da janela do console)
                capturer = new Capture(Priority.Low);
                capturer.EventHandler = p;
                capturer.StartCapture();

                AppDomain.CurrentDomain.ProcessExit += (s, e) => { try { capturer?.StopCapture(); } catch { } };
                Console.CancelKeyPress += (s, e) => { try { capturer?.StopCapture(); } catch { } };
                
                Console.WriteLine("[SDK] Leitor pronto e escutando eventos USB (Modo Cooperativo/Background)...");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERRO AO INICIAR LEITOR]: {ex.Message}");
            }

            HttpListener listener = new HttpListener();
            listener.Prefixes.Add("http://localhost:5000/");
            listener.Start();
            Console.WriteLine("[HTTP] Servidor biométrico rodando em http://localhost:5000/");

            Task.Run(() => ListenRequests(listener));

            Application.Run();
        }

        private static async Task ListenRequests(HttpListener listener)
        {
            while (true)
            {
                try
                {
                    var context = await listener.GetContextAsync();
                    var response = context.Response;

                    response.Headers.Add("Access-Control-Allow-Origin", "*");
                    response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                    response.Headers.Add("Access-Control-Allow-Headers", "*");
                    response.Headers.Add("Access-Control-Allow-Private-Network", "true");

                    if (context.Request.HttpMethod == "OPTIONS")
                    {
                        response.StatusCode = 204;
                        response.OutputStream.Close();
                        continue;
                    }

                    string responseString;

                    if (!string.IsNullOrEmpty(ultimaBiometriaBase64))
                    {
                        responseString = $"{{\"status\": \"LIDO\", \"template_base64\": \"{ultimaBiometriaBase64}\"}}";
                        ultimaBiometriaBase64 = null;
                    }
                    else if (dedoPresente)
                    {
                        responseString = "{\"status\": \"PROCESSANDO\"}";
                    }
                    else
                    {
                        responseString = "{\"status\": \"AGUARDANDO_DEDO\"}";
                    }

                    byte[] buffer = Encoding.UTF8.GetBytes(responseString);
                    response.ContentType = "application/json";
                    response.ContentLength64 = buffer.Length;
                    response.OutputStream.Write(buffer, 0, buffer.Length);
                    response.OutputStream.Close();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ERRO HTTP]: {ex.Message}");
                }
            }
        }

        // --- MÉTODOS OBRIGATÓRIOS DA INTERFACE DPFP.Capture.EventHandler ---

        public void OnFingerTouch(object Capture, string ReaderSerialNumber)
        {
            dedoPresente = true;
            Console.WriteLine("\n[HARDWARE] Dedo encostado no leitor!");
        }

        public void OnFingerGone(object Capture, string ReaderSerialNumber)
        {
            dedoPresente = false;
            Console.WriteLine("[HARDWARE] Dedo removido do leitor.");
        }

        public void OnSampleQuality(object Capture, string ReaderSerialNumber, CaptureFeedback CaptureFeedback)
        {
            Console.WriteLine($"[HARDWARE] Qualidade da amostra: {CaptureFeedback}");
        }

        public void OnComplete(object Capture, string ReaderSerialNumber, Sample Sample)
        {
            Console.WriteLine("[HARDWARE] Amostra capturada! Extraindo minúcias...");

            FeatureExtraction extractor = new FeatureExtraction();
            CaptureFeedback feedback = CaptureFeedback.None;
            FeatureSet features = new FeatureSet();

            extractor.CreateFeatureSet(Sample, DataPurpose.Verification, ref feedback, ref features);

            if (feedback == CaptureFeedback.Good)
            {
                using (MemoryStream ms = new MemoryStream())
                {
                    features.Serialize(ms);
                    ultimaBiometriaBase64 = Convert.ToBase64String(ms.ToArray());
                    Console.WriteLine("[SUCESSO] Biometria pronta para o Streamlit!");
                }
            }
            else
            {
                Console.WriteLine($"[AVISO] Amostra ruim ({feedback}). Tente novamente.");
            }
        }

        public void OnReaderConnect(object Capture, string ReaderSerialNumber)
        {
            Console.WriteLine($"[HARDWARE] Leitor Conectado: {ReaderSerialNumber}");
        }

        public void OnReaderDisconnect(object Capture, string ReaderSerialNumber)
        {
            Console.WriteLine("[HARDWARE] Leitor Desconectado!");
        }
    }
}