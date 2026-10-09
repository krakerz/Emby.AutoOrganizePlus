using System;
using System.Collections.Generic;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using System.IO;
using MediaBrowser.Model.Drawing;

namespace Emby.AutoOrganizePlus
{
    public class Plugin : BasePlugin, IHasWebPages, IHasThumbImage
    {
        public override string Name => "Auto Organize+";


        public override string Description
            => "Automatically organize new media (Auto Organize+ fork)";

        private Guid _id = new Guid("056861a9-c100-4ce6-a642-214279ad4347");
        public override Guid Id
        {
            get { return _id; }
        }

        public Stream GetThumbImage()
        {
            var type = GetType();
            return type.Assembly.GetManifestResourceStream(type.Namespace + ".thumb.jpg");
        }

        public ImageFormat ThumbImageFormat
        {
            get
            {
                return ImageFormat.Jpg;
            }
        }

        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = "AutoOrganizePlusLog",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.autoorganizelog.html",
                    EnableInMainMenu = true,
                    IsMainConfigPage = true,
                    DisplayName = "Auto Organize+",
                    MenuSection = "server",
                    MenuIcon = "folder_open"
                },
                new PluginPageInfo
                {
                    Name = "AutoOrganizePlusSmart",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.autoorganizesmart.html"
                },
                new PluginPageInfo
                {
                    Name = "AutoOrganizePlusTv",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.autoorganizetv.html"
                },
                new PluginPageInfo
                {
                    Name = "AutoOrganizePlusMovie",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.autoorganizemovie.html"
                },
                new PluginPageInfo
                {
                    Name = "AutoOrganizePlusLogJs",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.autoorganizelog.js"
                },
                new PluginPageInfo
                {
                    Name = "AutoOrganizePlusSmartJs",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.autoorganizesmart.js"
                },
                new PluginPageInfo
                {
                    Name = "AutoOrganizePlusTvJs",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.autoorganizetv.js"
                },
                new PluginPageInfo
                {
                    Name = "AutoOrganizePlusMovieJs",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.autoorganizemovie.js"
                },
                new PluginPageInfo
                {
                    Name = "AutoOrganizePlusFileOrganizerJs",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.fileorganizer.js"
                },
                new PluginPageInfo
                {
                    Name = "AutoOrganizePlusFileOrganizerHtml",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.fileorganizer.template.html"
                }
            };
        }
    }
}
