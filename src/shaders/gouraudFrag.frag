#version 330 core
in vec3 GouraudColor;

out vec4 FragColor;

void main()
{
    FragColor = vec4(GouraudColor, 1.0);
}