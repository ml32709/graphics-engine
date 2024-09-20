#version 330 core
in vec3 Normal;
in vec3 FragPos;

out vec4 FragColor;

uniform vec3 lightColor;
uniform vec3 lightPos;
uniform vec3 viewPos;

// ======================================================================
//   Parameters for the user to select
//   Simply edit constants and  "#define (constant)"
// ======================================================================

// ==========================================================
//   IMPORTANT
// ==========================================================
//
// (1) DOT PRODUCT
//     For the dot product, compute as shown in the example:
//     float NdotL = max( dot( N, L ), EPSILON ); 
//     Make sure to use above style for naming tyour 
//     variables storing the result of the dot product
// 
// (2) AVOID DIVISION BY ZERO, as in this example:
//     float my_result = ( num / max( den, EPSILON ) );
//
// ==========================================================

// Microfacet Distribution Function? 
// USE_D_1 = Beckman
// USE_D_2 = GGX (or Trowbridge-Reitz)
#define USE_D_1

// Roughness of Microfacets (m)
// Default m = 0.4 as in Cook & Torrance 1982.
const float M_PARAM = 0.1; 

// Albedo Measure (ρ) for SchlickFresnel()
// For copper (default) in the range of 0.2 to 0.4.
const float RHO_PARAM = 0.6; 

// Possible Combinations of 'D', 'G', and 'F' functions
// i.e., numerators of the main Cook-Torrance equation:
// ----------------------------------------------------------
#define USE_CT_NUM_DGF 1 // original ( D * G * F ) numerator
#define USE_CT_NUM_D   2 // ( D ) numerator
#define USE_CT_NUM_G   3 // ( G ) numerator
#define USE_CT_NUM_F   4 // ( F ) numerator
#define USE_CT_NUM_DG  5 // ( D * G ) numerator
#define USE_CT_NUM_DF  6 // ( D * F ) numerator
#define USE_CT_NUM_GF  7 // ( G * F ) numerator

const int CT_num = USE_CT_NUM_DGF; // numerator arrangement

// Multiply BRDF by (1 / PI)? i.e., comment // in/out 
// #define USE_INV_PI 

// ======================================================================
//   END - Parameters for the user to select
// ======================================================================
// ======================================================================
//   MATH
// ======================================================================

const float PI = 3.14159265358979323846;
const float INV_PI = 0.31830988618379067154; 
const float DEG_TO_RAD = PI / 180.0;
const float EPSILON = 0.00001; 

float BeckmannDistribution( vec3 H, vec3 N, float m ) 
// ----------------------------------------------------------------------
{
    float D;
    
    // BEGIN TODO #1 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    float NdotH = dot(N, H);
    float alpha = acos(NdotH);
    float e = 2.71828;
    
    D = pow(e, -pow(tan(alpha) / m, 2.0)) /
        max(EPSILON, (pow(m, 2.0) * pow(cos(alpha), 4.0)));
    
    // END TODO #1 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    
    #ifdef USE_INV_PI 
        D *= INV_PI;
    #endif

    return D;
}

float GGXDistribution( vec3 H, vec3 N, float m )
// ----------------------------------------------------------------------
{
    float D;
    
    // BEGIN TODO #2 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    float alpha = pow(m, 2.0);
    float NdotH = dot(N, H);
    
    D = pow(alpha, 2.0) /
        max(EPSILON, (PI * pow((pow(NdotH, 2.0) * (pow(alpha, 2.0) - 1.0) + 1.0), 2.0)));

    // END TODO #2 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    
    #ifdef USE_INV_PI 
        D *= INV_PI;
    #endif

    return D;
}

float SchlickFresnel ( float LdotH, float rho )
// ----------------------------------------------------------------------
{
    float F;
    
    // BEGIN TODO #3 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    F = rho + (1.0 - rho) * pow((1.0 - LdotH), 5.0);

    // END TODO #3 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

    return F; 
}

float GeometricAttenuation( float NdotH, 
                            float NdotV, 
                            float NdotL, 
                            float HdotV )
// ----------------------------------------------------------------------
{  
    float G;
    
    // BEGIN TODO #4 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    float gVisibility = (2.0 * NdotH * NdotV) / 
                        max(EPSILON, HdotV);

    float gExposed =    (2.0 * NdotH * NdotL) /
                        max(EPSILON, HdotV);

    G = min(1.0, min(gVisibility, gExposed));
    

    // END TODO #4 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    
    return G; 
}

float CookTorranceBRDF( vec3 L, vec3 V, vec3 N, float m, float rho ) 
// ----------------------------------------------------------------------
{
    // The result of your Cook-Torrance BRDF implementation
    float specularBRDF;
    // Numerator and Denominator of the main Cook-Torrance eq.
    float num, den; 
    // The 3 main fuctions of Cook-Torrance
    float D, G, F;
    
    // BEGIN TODO #5 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    vec3 H = normalize(L + V);
    float LdotH = dot(L, H);
    float NdotH = dot(N, H);
    float NdotV = dot(N, V);
    float NdotL = dot(N, L);
    float HdotV = dot(H, V);
    
    // Allow user selection by editing the #define and consts for 
    // the Beckmann distribution and the numerators of the 
    // main Cook-Torrance equation (refer to top of the shader code)
    
    #ifdef USE_D_1
        D = BeckmannDistribution(H, N, m);
    #else 
        D = GGXDistribution(H, N, m);
    #endif

    G = GeometricAttenuation(NdotH, NdotV, NdotL, HdotV);
    F = SchlickFresnel(LdotH, rho);

    // Possible Combinations of 'D', 'G', and 'F' functions  
    // i.e., numerators of the main Cook-Torrance equation
    // Refer to the top of the shader's code.

    switch ( CT_num )
    {
        case USE_CT_NUM_DGF:
            num = max( ( D * G * F ), EPSILON ); // Original Eq.
            break;
            
        case USE_CT_NUM_D:
            num = max( ( D ), EPSILON );
            break;
            
        case USE_CT_NUM_G:
            num = max( ( G ), EPSILON );
            break;
            
        case USE_CT_NUM_F:
            num = max( ( F ), EPSILON );
            break; 
            
        case USE_CT_NUM_DG:
            num = max( ( D * G ), EPSILON );
            break;
            
        case USE_CT_NUM_DF:
            num = max( ( D * F ), EPSILON );
            break;
            
        case USE_CT_NUM_GF:
            num = max( ( G * F ), EPSILON );
            break;            
            
        default: break;
    }

    den = NdotV * NdotL;

    den = max( den, EPSILON ); // Avoid division by zero
    specularBRDF = num / den;
    
    // END TODO #5 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ // 
        
    #ifdef USE_INV_PI 
        specularBRDF *= INV_PI;
    #endif
    
    return specularBRDF;
}

vec3 radiance(
    vec3 sample_pos,  // Location of sample to be shaded
    vec3 N,		      // Surface normal n
    vec3 L,		      // Incoming direction wi from vertex to light
    vec3 V,		      // Outgoing direction wo from vertex to view
    float m,	              // Material roughness
    float  rho,               // Albedo of material (Fresnel eq)
    vec3 ambi_col,            // Ambient reflectance of the material
    vec3 diff_col,	      // Diffuse reflectance of the material
    vec3 spec_col,            // Specular reflectance of the material
    vec3 light_col	      // Light color
    )
{
    // BEGIN TODO #6 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    float spec_strength =  CookTorranceBRDF(L, V, N, m, rho);
    vec3 spec_BRDF = spec_col * spec_strength;

    // Calculate the equivalent cos(theta) of Lambert's law
    float LdotN = max(0.0, dot(L, N));

    // END TODO #6 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    
    // Combine the ambient, diffuse, and specular BRDFs
    vec3 finalColor = vec3( 0.0 );

    vec3 ambi_BRDF = ambi_col;
    vec3 diff_BRDF = diff_col;
      
    #ifdef USE_INV_PI 
        ambi_BRDF *= INV_PI;
        diff_BRDF *= INV_PI;
    #endif
    
    finalColor = ( ambi_BRDF + diff_BRDF + spec_BRDF ) * ( light_col * LdotN );
    
    return finalColor;
}

vec3 shading(vec3 sample_pos, vec3 N, vec3 eye_pos)
// ----------------------------------------------------------------------
{
    // COPPER
    // https://people.eecs.ku.edu/~jrmiller/Courses/672/InClass/3DLighting/MaterialProperties.html
    // http://learnwebgl.brown37.net/10_surface_properties/surface_properties_color.html
    // https://physicallybased.info/

    // copper
    // vec3 amb_col =  vec3( 0.19125, 0.0735, 0.0225 );
    // vec3 diff_col = vec3( 0.926,   0.721,  0.504  );
    // vec3 spec_col = vec3( 0.996,   0.957,  0.823  );

    vec3 amb_col =  vec3( 0.0215, 0.1745, 0.0215 );
    vec3 diff_col = vec3( 0.07568,   0.61424,  0.07568  );
    vec3 spec_col = vec3( 0.633,   0.727811,  0.633  );

    // Allow user selection by editing the values of 
    // consts float M_PARAM and RHO_PARAM
    // (refer to top of the shader code) 
    float m = M_PARAM;
    float rho = RHO_PARAM;
    
    // BEGIN TODO #7 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    
    // view (eye, camera) vector wo
    vec3 V = normalize(eye_pos - sample_pos);

    // Final radiance
    vec3 Le = vec3 ( 0.0 );

    // -- LIGHT #1 ----------------------------------
    {
        vec3 light_pos = lightPos;
        vec3 light_col = lightColor;

        // Light Vector L
        vec3 L = normalize(light_pos - sample_pos);
        // Accumulated Radiance
        Le = Le + radiance(sample_pos, N, L, V, m, rho, amb_col, diff_col, spec_col, light_col);
    }
    
    // END TODO #7 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    
    return ( amb_col + Le );
}

void main() {
    FragColor = vec4(shading(FragPos, Normal, viewPos), 1.0);
}