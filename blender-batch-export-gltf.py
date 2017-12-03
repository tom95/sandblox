from io_scene_gltf2 import gltf2_export
import bpy
import os

directory = os.path.join(os.path.dirname(bpy.data.filepath), '..')

for obj in bpy.context.selected_objects[:]:
    for other in bpy.data.objects:
        other.select = False
    obj.select = True
    context = {
        'gltf_filepath': os.path.join(directory, obj.data.name + '.gltf'),
        'gltf_filedirectory': directory,
        'gltf_embed_buffers': True,
        'gltf_embed_images': False,
        'gltf_strip': False,
        'gltf_indices': 'UNSIGNED_INT',
        'gltf_format': 'ASCII',
        'gltf_force_indices': False,
        'gltf_texcoords': True,
        'gltf_normals': True,
        'gltf_tangents': False,
        'gltf_materials': False,
        'gltf_colors': False,
        'gltf_cameras': False,
        'gltf_camera_infinite': False,
        'gltf_selected': True,
        'gltf_layers': False,
        'gltf_extras': False,
        'gltf_apply': True,
        'gltf_animations': False,
        'gltf_current_frame': True,
        'gltf_framge_range': False,
        'gltf_move_keyframes': False,
        'gltf_force_sampling': False,
        'gltf_skins': False,
        'gltf_base_skins': False,
        'gltf_morph': False,
        'gltf_morph_normals': False,
        'gltf_morph_tangent': False,
        'gltf_lights_pbr': False,
        'gltf_lights_cmn': False,
        'gltf_common': False,
        'gltf_displacement': False,
        'gltf_uri': [],
        'gltf_copyright': '',
        'gltf_binary': bytearray(),
        'gltf_binaryfilename': os.path.join(directory, obj.data.name + '.bin')
    }
    print('Exporting ' + obj.data.name)
    gltf2_export.save(None, bpy.context, context)
