// Config plugin: adds CallKit Call Directory Extension + reload native module to the iOS project.
// Runs during `expo prebuild` (triggered automatically by EAS Build).

const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const EXT_NAME = 'CallShieldExtension';
const APP_GROUP = 'group.callshield.blocked';

function uid() {
  return crypto.randomBytes(12).toString('hex').toUpperCase();
}

module.exports = function withCallDirectoryExtension(config) {
  config = copyExtensionFiles(config);
  config = copyNativeModuleFiles(config);
  config = patchXcodeProject(config);
  return config;
};

// ─── 1. Copy extension Swift + plist + entitlements into ios/<EXT_NAME>/ ──────
function copyExtensionFiles(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const root = cfg.modRequest.projectRoot;
      const src = path.join(root, 'extension');
      const dest = path.join(root, 'ios', EXT_NAME);

      fs.mkdirSync(dest, { recursive: true });

      for (const file of fs.readdirSync(src)) {
        fs.copyFileSync(path.join(src, file), path.join(dest, file));
      }
      return cfg;
    },
  ]);
}

// ─── 3. Copy native module files into ios/<AppName>/ ─────────────────────────
function copyNativeModuleFiles(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const root = cfg.modRequest.projectRoot;
      const src = path.join(root, 'native');
      // Expo names the iOS app folder after the sanitized app name
      const appName = (cfg.name || 'CallShield').replace(/[^a-zA-Z0-9]/g, '');
      const dest = path.join(root, 'ios', appName);

      if (!fs.existsSync(src)) return cfg;
      fs.mkdirSync(dest, { recursive: true });

      for (const file of fs.readdirSync(src)) {
        fs.copyFileSync(path.join(src, file), path.join(dest, file));
      }
      return cfg;
    },
  ]);
}

// ─── 4. Add the extension target + native module to the Xcode project ─────────
function patchXcodeProject(config) {
  return withXcodeProject(config, (cfg) => {
    const proj = cfg.modResults;
    const mainBundleId = cfg.ios?.bundleIdentifier || 'com.callshield.app';

    if (!extensionExists(proj)) {
      addExtension(proj, mainBundleId);
    }
    if (!nativeModuleExists(proj)) {
      addNativeModule(proj);
    }
    return cfg;
  });
}

function extensionExists(proj) {
  const targets = proj.pbxNativeTargetSection();
  return Object.values(targets).some((t) => t && t.name === EXT_NAME);
}

function nativeModuleExists(proj) {
  const refs = proj.hash.project.objects.PBXFileReference || {};
  return Object.values(refs).some(
    (r) => r && r.path === 'CallDirectoryReloader.swift'
  );
}

// ─── Add native module files to main app target ───────────────────────────────
function addNativeModule(proj) {
  const objs = proj.hash.project.objects;
  const mainTargetUuid = proj.getFirstTarget().uuid;

  const IDs = {
    swiftRef: uid(),
    swiftBuild: uid(),
    objcRef: uid(),
    objcBuild: uid(),
  };

  objs.PBXFileReference = objs.PBXFileReference || {};
  objs.PBXFileReference[IDs.swiftRef] = {
    isa: 'PBXFileReference',
    lastKnownFileType: 'sourcecode.swift',
    path: 'CallDirectoryReloader.swift',
    sourceTree: '"<group>"',
  };
  objs.PBXFileReference[IDs.objcRef] = {
    isa: 'PBXFileReference',
    lastKnownFileType: 'sourcecode.c.objc',
    path: 'CallDirectoryReloader.m',
    sourceTree: '"<group>"',
  };

  objs.PBXBuildFile = objs.PBXBuildFile || {};
  objs.PBXBuildFile[IDs.swiftBuild] = { isa: 'PBXBuildFile', fileRef: IDs.swiftRef };
  objs.PBXBuildFile[IDs.objcBuild] = { isa: 'PBXBuildFile', fileRef: IDs.objcRef };

  // Add to main app's Sources build phase
  const mainTarget = objs.PBXNativeTarget[mainTargetUuid];
  for (const phaseRef of mainTarget.buildPhases) {
    const phaseUuid = phaseRef.value;
    if (objs.PBXSourcesBuildPhase && objs.PBXSourcesBuildPhase[phaseUuid]) {
      objs.PBXSourcesBuildPhase[phaseUuid].files.push(
        { value: IDs.swiftBuild, comment: 'CallDirectoryReloader.swift in Sources' },
        { value: IDs.objcBuild, comment: 'CallDirectoryReloader.m in Sources' }
      );
      break;
    }
  }

  // Add file refs to main group so Xcode shows them
  const projUuid = proj.getFirstProject().uuid;
  const mainGroupId = objs.PBXProject[projUuid].mainGroup;
  if (mainGroupId && objs.PBXGroup[mainGroupId]) {
    objs.PBXGroup[mainGroupId].children.push(
      { value: IDs.swiftRef, comment: 'CallDirectoryReloader.swift' },
      { value: IDs.objcRef, comment: 'CallDirectoryReloader.m' }
    );
  }
}

// ─── Add extension target ─────────────────────────────────────────────────────
function addExtension(proj, mainBundleId) {
  const extBundleId = `${mainBundleId}.${EXT_NAME}`;
  const objs = proj.hash.project.objects;

  const IDs = {
    target: uid(),
    configList: uid(),
    debugConfig: uid(),
    releaseConfig: uid(),
    sourcesPhase: uid(),
    frameworksPhase: uid(),
    copyFilesPhase: uid(),
    group: uid(),
    productRef: uid(),
    swiftRef: uid(),
    swiftBuild: uid(),
    plistRef: uid(),
    entRef: uid(),
    callkitRef: uid(),
    callkitBuild: uid(),
    embedBuild: uid(),
  };

  objs.PBXFileReference = objs.PBXFileReference || {};
  objs.PBXFileReference[IDs.swiftRef] = {
    isa: 'PBXFileReference',
    lastKnownFileType: 'sourcecode.swift',
    path: 'CallDirectoryHandler.swift',
    sourceTree: '"<group>"',
  };
  objs.PBXFileReference[IDs.plistRef] = {
    isa: 'PBXFileReference',
    lastKnownFileType: 'text.plist.xml',
    path: 'Info.plist',
    sourceTree: '"<group>"',
  };
  objs.PBXFileReference[IDs.entRef] = {
    isa: 'PBXFileReference',
    lastKnownFileType: 'text.plist.entitlements',
    path: `${EXT_NAME}.entitlements`,
    sourceTree: '"<group>"',
  };
  objs.PBXFileReference[IDs.callkitRef] = {
    isa: 'PBXFileReference',
    lastKnownFileType: 'wrapper.framework',
    name: 'CallKit.framework',
    path: 'System/Library/Frameworks/CallKit.framework',
    sourceTree: 'SDKROOT',
  };
  objs.PBXFileReference[IDs.productRef] = {
    isa: 'PBXFileReference',
    explicitFileType: 'wrapper.app-extension',
    includeInIndex: 0,
    path: `${EXT_NAME}.appex`,
    sourceTree: 'BUILT_PRODUCTS_DIR',
  };

  objs.PBXBuildFile = objs.PBXBuildFile || {};
  objs.PBXBuildFile[IDs.swiftBuild] = { isa: 'PBXBuildFile', fileRef: IDs.swiftRef };
  objs.PBXBuildFile[IDs.callkitBuild] = { isa: 'PBXBuildFile', fileRef: IDs.callkitRef };
  objs.PBXBuildFile[IDs.embedBuild] = {
    isa: 'PBXBuildFile',
    fileRef: IDs.productRef,
    settings: { ATTRIBUTES: ['RemoveHeadersOnCopy'] },
  };

  objs.PBXGroup = objs.PBXGroup || {};
  objs.PBXGroup[IDs.group] = {
    isa: 'PBXGroup',
    children: [
      { value: IDs.swiftRef, comment: 'CallDirectoryHandler.swift' },
      { value: IDs.plistRef, comment: 'Info.plist' },
      { value: IDs.entRef, comment: `${EXT_NAME}.entitlements` },
    ],
    path: EXT_NAME,
    sourceTree: '"<group>"',
  };

  const projUuid = proj.getFirstProject().uuid;
  const mainGroupId = objs.PBXProject[projUuid].mainGroup;
  if (mainGroupId && objs.PBXGroup[mainGroupId]) {
    objs.PBXGroup[mainGroupId].children.push({ value: IDs.group, comment: EXT_NAME });
  }

  objs.PBXSourcesBuildPhase = objs.PBXSourcesBuildPhase || {};
  objs.PBXSourcesBuildPhase[IDs.sourcesPhase] = {
    isa: 'PBXSourcesBuildPhase',
    buildActionMask: 2147483647,
    files: [{ value: IDs.swiftBuild, comment: 'CallDirectoryHandler.swift in Sources' }],
    runOnlyForDeploymentPostprocessing: 0,
  };

  objs.PBXFrameworksBuildPhase = objs.PBXFrameworksBuildPhase || {};
  objs.PBXFrameworksBuildPhase[IDs.frameworksPhase] = {
    isa: 'PBXFrameworksBuildPhase',
    buildActionMask: 2147483647,
    files: [{ value: IDs.callkitBuild, comment: 'CallKit.framework in Frameworks' }],
    runOnlyForDeploymentPostprocessing: 0,
  };

  const commonSettings = {
    ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES: 'NO',
    CODE_SIGN_ENTITLEMENTS: `"${EXT_NAME}/${EXT_NAME}.entitlements"`,
    CODE_SIGN_STYLE: 'Automatic',
    INFOPLIST_FILE: `"${EXT_NAME}/Info.plist"`,
    IPHONEOS_DEPLOYMENT_TARGET: '13.4',
    LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
    PRODUCT_BUNDLE_IDENTIFIER: `"${extBundleId}"`,
    PRODUCT_NAME: '"$(TARGET_NAME)"',
    SKIP_INSTALL: 'YES',
    SWIFT_VERSION: '5.0',
    TARGETED_DEVICE_FAMILY: '"1,2"',
  };

  objs.XCBuildConfiguration = objs.XCBuildConfiguration || {};
  objs.XCBuildConfiguration[IDs.debugConfig] = {
    isa: 'XCBuildConfiguration',
    buildSettings: { ...commonSettings, DEBUG_INFORMATION_FORMAT: 'dwarf' },
    name: 'Debug',
  };
  objs.XCBuildConfiguration[IDs.releaseConfig] = {
    isa: 'XCBuildConfiguration',
    buildSettings: { ...commonSettings, DEBUG_INFORMATION_FORMAT: '"dwarf-with-dsym"', VALIDATE_PRODUCT: 'YES' },
    name: 'Release',
  };

  objs.XCConfigurationList = objs.XCConfigurationList || {};
  objs.XCConfigurationList[IDs.configList] = {
    isa: 'XCConfigurationList',
    buildConfigurations: [
      { value: IDs.debugConfig, comment: 'Debug' },
      { value: IDs.releaseConfig, comment: 'Release' },
    ],
    defaultConfigurationIsVisible: 0,
    defaultConfigurationName: 'Release',
  };

  objs.PBXNativeTarget = objs.PBXNativeTarget || {};
  objs.PBXNativeTarget[IDs.target] = {
    isa: 'PBXNativeTarget',
    buildConfigurationList: IDs.configList,
    buildPhases: [
      { value: IDs.sourcesPhase, comment: 'Sources' },
      { value: IDs.frameworksPhase, comment: 'Frameworks' },
    ],
    buildRules: [],
    dependencies: [],
    name: EXT_NAME,
    productName: EXT_NAME,
    productReference: IDs.productRef,
    productType: '"com.apple.product-type.app-extension"',
  };

  objs.PBXProject[projUuid].targets.push({ value: IDs.target, comment: EXT_NAME });

  const productsGroupId = objs.PBXProject[projUuid].productRefGroup;
  if (productsGroupId && objs.PBXGroup[productsGroupId]) {
    objs.PBXGroup[productsGroupId].children.push({ value: IDs.productRef, comment: `${EXT_NAME}.appex` });
  }

  objs.PBXCopyFilesBuildPhase = objs.PBXCopyFilesBuildPhase || {};
  objs.PBXCopyFilesBuildPhase[IDs.copyFilesPhase] = {
    isa: 'PBXCopyFilesBuildPhase',
    buildActionMask: 2147483647,
    dstPath: '""',
    dstSubfolderSpec: 13,
    files: [{ value: IDs.embedBuild, comment: `${EXT_NAME}.appex in Embed Foundation Extensions` }],
    name: '"Embed Foundation Extensions"',
    runOnlyForDeploymentPostprocessing: 0,
  };

  const mainTargetUuid = proj.getFirstTarget().uuid;
  if (objs.PBXNativeTarget[mainTargetUuid]) {
    objs.PBXNativeTarget[mainTargetUuid].buildPhases.push({
      value: IDs.copyFilesPhase,
      comment: '"Embed Foundation Extensions"',
    });
  }
}
