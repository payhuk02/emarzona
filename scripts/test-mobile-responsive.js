// Test script pour vérifier l'affichage mobile des logos et avatars
// Ce script vérifie les éléments critiques pour l'affichage mobile

const mobileResponsiveTests = {
  // Test du logo dans la sidebar
  sidebarLogo: {
    selector: '.sidebar img[alt="Payhuk"]',
    expectedClasses: ['h-8', 'w-8', 'flex-shrink-0'],
    mobileIssues: [
      'Logo trop petit sur mobile',
      'Logo pas assez visible',
      'Logo mal positionné'
    ]
  },

  // Test du logo dans le header marketplace
  marketplaceLogo: {
    selector: 'header img[alt="Payhuk"]',
    expectedClasses: ['h-7', 'w-7', 'sm:h-8', 'sm:w-8'],
    mobileIssues: [
      'Logo marketplace trop petit',
      'Logo pas responsive',
      'Logo mal aligné'
    ]
  },

  // Test des avatars dans ProfileSettings
  profileAvatar: {
    selector: '.profile-settings .avatar',
    expectedClasses: ['h-20', 'w-20'],
    mobileIssues: [
      'Avatar trop petit sur mobile',
      'Avatar mal positionné',
      'Bouton de suppression mal placé'
    ]
  },

  // Test des avatars dans AvatarUpload
  avatarUpload: {
    selector: '.avatar-upload .avatar',
    expectedClasses: ['h-20', 'w-20', 'sm:h-24', 'sm:w-24'],
    mobileIssues: [
      'Avatar upload pas responsive',
      'Boutons mal positionnés',
      'Layout cassé sur mobile'
    ]
  },

  // Test des avatars de store
  storeAvatar: {
    selector: '.store-header .avatar, .store-header img',
    expectedClasses: ['h-24', 'w-24', 'sm:h-28', 'sm:w-28'],
    mobileIssues: [
      'Avatar store trop petit',
      'Avatar store mal positionné',
      'Bordure trop épaisse'
    ]
  }
};

// Fonction pour tester chaque élément
function testMobileResponsiveness() {
  const results = {};
  
  Object.keys(mobileResponsiveTests).forEach(testKey => {
    const test = mobileResponsiveTests[testKey];
    const elements = document.querySelectorAll(test.selector);
    
    results[testKey] = {
      found: elements.length > 0,
      count: elements.length,
      issues: []
    };
    
    elements.forEach((element, index) => {
      const classes = element.className.split(' ');
      const missingClasses = test.expectedClasses.filter(cls => 
        !classes.some(c => c.includes(cls))
      );
      
      if (missingClasses.length > 0) {
        results[testKey].issues.push({
          element: index,
          missingClasses,
          currentClasses: classes
        });
      }
    });
  });
  
  return results;
}

// Fonction pour vérifier les breakpoints
function checkBreakpoints() {
  const breakpoints = {
    mobile: window.innerWidth < 640,
    tablet: window.innerWidth >= 640 && window.innerWidth < 1024,
    desktop: window.innerWidth >= 1024
  };
  
  return {
    current: breakpoints,
    width: window.innerWidth,
    height: window.innerHeight
  };
}

// Fonction principale de test
function runMobileTests() {
  console.log('🔍 Test d\'affichage mobile - Logos et Avatars');
  console.log('==============================================');
  
  const breakpointInfo = checkBreakpoints();
  console.log('📱 Breakpoint actuel:', breakpointInfo);
  
  const testResults = testMobileResponsiveness();
  console.log('🧪 Résultats des tests:', testResults);
  
  // Vérifications spécifiques
  const specificChecks = {
    sidebarLogoVisible: document.querySelector('.sidebar img[alt="Emarzona"]') !== null,
    marketplaceLogoVisible: document.querySelector('header img[alt="Emarzona"]') !== null,
    profileAvatarVisible: document.querySelector('.profile-settings .avatar') !== null,
    avatarUploadVisible: document.querySelector('.avatar-upload .avatar') !== null
  };
  
  console.log('✅ Éléments visibles:', specificChecks);
  
  // Recommandations
  const recommendations = [];
  
  if (breakpointInfo.current.mobile) {
    recommendations.push('📱 Mode mobile détecté - Vérifiez la taille des logos et avatars');
    recommendations.push('🔍 Assurez-vous que les logos sont assez grands pour être visibles');
    recommendations.push('👤 Vérifiez que les avatars sont bien positionnés et accessibles');
  }
  
  if (testResults.sidebarLogo.issues.length > 0) {
    recommendations.push('⚠️ Logo sidebar: Ajoutez des classes responsive (sm:h-10 sm:w-10)');
  }
  
  if (testResults.profileAvatar.issues.length > 0) {
    recommendations.push('⚠️ Avatar profil: Vérifiez les classes responsive');
  }
  
  console.log('💡 Recommandations:', recommendations);
  
  return {
    breakpointInfo,
    testResults,
    specificChecks,
    recommendations
  };
}

// Exporter pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.mobileResponsiveTest = runMobileTests;
  console.log('🚀 Test mobile disponible: window.mobileResponsiveTest()');
}

module.exports = { mobileResponsiveTests, runMobileTests };
