/**
 * The part of three.js the site draws with: the head (hero/Head3D and its
 * blood) and the glass (lib/glassSpheres). Everything imports three through
 * here, by name, so the bundler keeps these classes and drops the rest of
 * the library. Handed the whole of `three` as a namespace (the glass used to
 * take `import('three')`), it had to keep all of it: twice the script for
 * the same drawing.
 *
 * A class used anywhere else goes on this list; a missing one is a type
 * error, not a surprise at run time.
 */
export {
  AddEquation,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CustomBlending,
  DoubleSide,
  DynamicDrawUsage,
  GLSL3,
  HalfFloatType,
  InstancedBufferGeometry,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  LinearFilter,
  Material,
  Mesh,
  NoBlending,
  NoColorSpace,
  OneFactor,
  OneMinusSrcAlphaFactor,
  OrthographicCamera,
  PlaneGeometry,
  RawShaderMaterial,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  UnsignedByteType,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';

export type { IUniform, ShaderMaterialParameters } from 'three';
