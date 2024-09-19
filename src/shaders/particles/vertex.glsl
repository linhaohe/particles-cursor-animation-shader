uniform vec2 uResolution;
uniform sampler2D uTexture;
uniform sampler2D uCanvasTexture;

varying vec3 vColor;

attribute float aAngle;
void main()
{
    vec3 newPosition = position;
    float displacementItensity = texture2D(uCanvasTexture,uv).r;
    displacementItensity = smoothstep(0.1,0.3,displacementItensity);
    newPosition.x += cos(aAngle) * displacementItensity;
    newPosition.y += sin(aAngle) * displacementItensity;
    newPosition.z += displacementItensity;
    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
    float particleIntensity = texture2D(uTexture,uv).r;

    // Point size
    gl_PointSize = 0.15 * uResolution.y * particleIntensity;
    gl_PointSize *= (1.0 / - viewPosition.z);
    vColor = vec3(pow(particleIntensity,2.0));
}