using System;
using System.IO;
using System.Threading;
using Emby.AutoOrganizePlus.Core;
using Emby.AutoOrganizePlus.Data;
using Emby.AutoOrganizePlus.Model;
using MediaBrowser.Controller.Configuration;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Plugins;
using MediaBrowser.Controller.Providers;
using MediaBrowser.Controller.Session;
using MediaBrowser.Model.Events;
using MediaBrowser.Model.IO;
using MediaBrowser.Model.Logging;
using MediaBrowser.Model.Serialization;
using MediaBrowser.Model.Tasks;

namespace Emby.AutoOrganizePlus
{
    public class PluginEntryPoint : IServerEntryPoint
    {
        public static PluginEntryPoint Current;

        public IFileOrganizationService FileOrganizationService { get; private set; }
        private readonly ISessionManager _sessionManager;

        private readonly ITaskManager _taskManager;
        private readonly ILogger _logger;
        private readonly ILibraryMonitor _libraryMonitor;
        private readonly ILibraryManager _libraryManager;
        private readonly IServerConfigurationManager _config;
        private readonly IFileSystem _fileSystem;
        private readonly IProviderManager _providerManager;
        private readonly IJsonSerializer _json;

        public IFileOrganizationRepository Repository;

        public PluginEntryPoint(ISessionManager sessionManager, ITaskManager taskManager, ILogger logger, ILibraryMonitor libraryMonitor, ILibraryManager libraryManager, IServerConfigurationManager config, IFileSystem fileSystem, IProviderManager providerManager, IJsonSerializer json)
        {
            _sessionManager = sessionManager;
            _taskManager = taskManager;
            _logger = logger;
            _libraryMonitor = libraryMonitor;
            _libraryManager = libraryManager;
            _config = config;
            _fileSystem = fileSystem;
            _providerManager = providerManager;
            _json = json;
        }

        public void Run()
        {
            try
            {
                Repository = GetRepository();
            }
            catch (Exception ex)
            {
                _logger.ErrorException("Error initializing auto-organize database", ex);
            }

            ImportStockPluginConfiguration();

            Current = this;
            FileOrganizationService = new FileOrganizationService(_taskManager, Repository, _logger, _libraryMonitor, _libraryManager, _config, _fileSystem, _providerManager);

            FileOrganizationService.ItemAdded += _organizationService_ItemAdded;
            FileOrganizationService.ItemRemoved += _organizationService_ItemRemoved;
            FileOrganizationService.ItemUpdated += _organizationService_ItemUpdated;
            FileOrganizationService.LogReset += _organizationService_LogReset;

            // Convert Config
            _config.Convert(FileOrganizationService);
        }

        // Seed our own config from the stock Auto Organize plugin once, so both can be installed side by side
        private void ImportStockPluginConfiguration()
        {
            try
            {
                var configDir = _config.ApplicationPaths.ConfigurationDirectoryPath;
                var ownPath = Path.Combine(configDir, ConfigurationExtension.AutoOrganizeOptionsKey + ".xml");
                var stockPath = Path.Combine(configDir, "autoorganize.xml");

                if (!_fileSystem.FileExists(ownPath) && _fileSystem.FileExists(stockPath))
                {
                    _fileSystem.CopyFile(stockPath, ownPath, false);
                    _logger.Info("Imported Auto Organize settings from {0}", stockPath);
                }
            }
            catch (Exception ex)
            {
                _logger.ErrorException("Error importing Auto Organize settings", ex);
            }
        }

        private IFileOrganizationRepository GetRepository()
        {
            var repo = new SqliteFileOrganizationRepository(_logger, _config.ApplicationPaths, _json);

            repo.Initialize();

            return repo;
        }

        private void _organizationService_LogReset(object sender, EventArgs e)
        {
            _sessionManager.SendMessageToAdminSessions("AutoOrganizePlus_LogReset", (FileOrganizationResult)null, CancellationToken.None);
        }

        private void _organizationService_ItemUpdated(object sender, GenericEventArgs<FileOrganizationResult> e)
        {
            _sessionManager.SendMessageToAdminSessions("AutoOrganizePlus_ItemUpdated", e.Argument, CancellationToken.None);
        }

        private void _organizationService_ItemRemoved(object sender, GenericEventArgs<FileOrganizationResult> e)
        {
            _sessionManager.SendMessageToAdminSessions("AutoOrganizePlus_ItemRemoved", e.Argument, CancellationToken.None);
        }

        private void _organizationService_ItemAdded(object sender, GenericEventArgs<FileOrganizationResult> e)
        {
            _sessionManager.SendMessageToAdminSessions("AutoOrganizePlus_ItemAdded", e.Argument, CancellationToken.None);
        }

        public void Dispose()
        {
            FileOrganizationService.ItemAdded -= _organizationService_ItemAdded;
            FileOrganizationService.ItemRemoved -= _organizationService_ItemRemoved;
            FileOrganizationService.ItemUpdated -= _organizationService_ItemUpdated;
            FileOrganizationService.LogReset -= _organizationService_LogReset;

            var repo = Repository as IDisposable;
            if (repo != null)
            {
                repo.Dispose();
            }
        }
    }
}
