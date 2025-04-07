import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';

const String apiBaseUrl = 'https://api.scuba2havefun.xyz/api';

// Represents a chat message
class Message {
  final String content;
  final String sender;
  final DateTime? timestamp;

  Message({
    required this.content,
    required this.sender,
    this.timestamp,
  });

  // Create a message from JSON
  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      content: json['content'] ?? '',
      sender: json['sender'] ?? 'assistant',
      timestamp: json['timestamp'] != null ? DateTime.parse(json['timestamp']) : null,
    );
  }
}

// Represents a chat model
class ChatModel {
  final String id;
  final String title;
  final DateTime lastUpdated;
  final List<Message> messages;

  ChatModel({
    required this.id,
    required this.title,
    required this.lastUpdated,
    required this.messages,
  });

  factory ChatModel.fromJson(Map<String, dynamic> json) {
    var messagesList = <Message>[];
    if (json['messages'] != null) {
      messagesList = (json['messages'] as List)
          .map((m) => Message.fromJson(m))
          .toList();
    }
    return ChatModel(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      lastUpdated: DateTime.parse(json['lastUpdated'] ?? DateTime.now().toString()),
      messages: messagesList,
    );
  }
}

// Represents a class model
class ClassModel {
  final String id;
  final String name;
  final String number;

  ClassModel({
    required this.id,
    required this.name,
    required this.number,
  });

  factory ClassModel.fromJson(Map<String, dynamic> json) {
    return ClassModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      number: json['number'] ?? '',
    );
  }
}

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  List<ChatModel> _chats = [];      // List of all chats
  ChatModel? _currentChat;          // Current chat
  String _message = '';             // Current message
  bool _loading = false;            // Loading state
  String _error = '';               // Error message
  List<ClassModel> _classes = [];   // List of classes

  bool _showEducationalContext = false;   // Toggles between chats and class context
  bool _isSidebarCollapsed = false;       // Sidebar state

  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _checkTokenAndFetchData();
  }

  // Check for valid token
  Future<void> _checkTokenAndFetchData() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    // Navigate back to login
    if (token == null || token.isEmpty) {
      Navigator.of(context).pushReplacementNamed('/login');
    } 
    else {
      _fetchChats();
      _fetchClasses();
    }
  }

  // Fetch list of chats
  Future<void> _fetchChats() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await http.get(Uri.parse('$apiBaseUrl/chat/list?jwtToken=$token'));
      final data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {

        // Parse list of chats from JSON
        List<ChatModel> chats = (data['chats'] as List)
            .map((chatJson) => ChatModel.fromJson(chatJson))
            .toList();
        setState(() {
          _chats = chats;
        });

        // Update token
        if (data['jwtToken'] != null) {
          prefs.setString('token', data['jwtToken']);
        }
      } 
      else {
        setState(() {
          _error = data['msg'] ?? 'Failed to load chats';
        });
      }
    } 
    catch (e) {
      setState(() {
        _error = 'Error fetching chats: $e';
      });
    }
  }

  // Fetch list of classes
  Future<void> _fetchClasses() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await http.get(Uri.parse('$apiBaseUrl/classes/allClasses?token=$token'));
      final data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        final classesData = data['classes'] as List?;
        if (classesData != null) {
          setState(() {
            _classes = classesData.map((clsJson) => ClassModel.fromJson(clsJson)).toList();
          });
        }

        // Update token
        if (data['token'] != null) {
          prefs.setString('token', data['token']);
        }
      } 
      else {
        debugPrint('Error fetching classes: ${data['msg']}');
      }
    } 
    catch (e) {
      debugPrint('Error fetching classes: $e');
    }
  }

  // Load chat from its ID
  Future<void> _loadChat(String chatId) async {
    setState(() => _loading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await http.get(Uri.parse('$apiBaseUrl/chat/detail?chatId=$chatId&jwtToken=$token'));
      final data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {

        // Parse chat details from JSON
        final chat = ChatModel.fromJson(data['chat']);
        setState(() {
          _currentChat = chat;
        });
        if (data['jwtToken'] != null) {
          prefs.setString('token', data['jwtToken']);
        }
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _scrollToBottom();
        });
      } 
      else {
        setState(() {
          _error = data['msg'] ?? 'Failed to load chat';
        });
      }
    } 
    catch (e) {
      setState(() {
        _error = 'Error loading chat: $e';
      });
    } 
    finally {
      setState(() => _loading = false);
    }
  }

  // Clear current chat
  void _createNewChat() {
    setState(() {
      _currentChat = null;
    });
  }

  Future<void> _sendMessage() async {
    if (_message.trim().isEmpty) return;
    final userMessage = Message(content: _message, sender: 'user');
    setState(() {
      if (_currentChat != null) {
        
        // Add a new message to chat
        final updatedMessages = List<Message>.from(_currentChat!.messages)..add(userMessage);
        _currentChat = ChatModel(
          id: _currentChat!.id,
          title: _currentChat!.title,
          messages: updatedMessages,
          lastUpdated: DateTime.now(),
        );
      } 
      else {
        _currentChat = ChatModel(
          id: 'temp-id',
          title: _getDefaultChatTitle(_message),
          messages: [userMessage],
          lastUpdated: DateTime.now(),
        );
      }
      _message = '';
      _loading = true;
    });
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final body = {
        'message': userMessage.content,
        'chatId': _currentChat?.id == 'temp-id' ? null : _currentChat!.id,
        'jwtToken': token,
      };
      final response = await http.post(
        Uri.parse('$apiBaseUrl/chat/send'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        final chat = ChatModel.fromJson(data['chat']);
        setState(() {
          _currentChat = chat;
        });
        if (chat.id.isNotEmpty && chat.id != 'temp-id') {
          _fetchChats();
        }
        if (data['jwtToken'] != null) {
          prefs.setString('token', data['jwtToken']);
        }
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _scrollToBottom();
        });
        if (_showEducationalContext) {
          setState(() {
            _showEducationalContext = false;
          });
        }
      } 
      else {
        setState(() {
          _error = data['msg'] ?? 'Failed to send message';
        });
      }
    } 
    catch (e) {
      setState(() {
        _error = 'Error sending message: $e';
      });
    } 
    finally {
      setState(() => _loading = false);
    }
  }

  // Delete a chat
  Future<void> _deleteChat(String chatId) async {

    // Delete confirmation
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Chat'),
        content: const Text('Are you sure you want to delete this chat?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final body = {
        'chatId': chatId,
        'jwtToken': token,
      };
      final response = await http.post(
        Uri.parse('$apiBaseUrl/chat/delete'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {

        // Remove chat from list and clear chat if deleted
        setState(() {
          _chats.removeWhere((chat) => chat.id == chatId);
          if (_currentChat?.id == chatId) {
            _currentChat = null;
          }
        });
      } 
      else {
        setState(() {
          _error = data['msg'] ?? 'Failed to delete chat';
        });
      }
    } 
    catch (e) {
      setState(() {
        _error = 'Error deleting chat: $e';
      });
    }
  }

  // Generates chat title from first message of chat
  String _getDefaultChatTitle(String firstMessage) {
    if (firstMessage.length <= 30) return firstMessage;
    return '${firstMessage.substring(0, 30)}...';
  }

  // Format of the date
  String _formatDate(DateTime date) {
    return date.toLocal().toString();
  }

  // Scroll view of messages to bottom
  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
    }
  }

  // Creates a contextual prompt based on a selected class, and sends it as a message
  Future<void> _createContextualPrompt(String classId) async {
    final selectedClass = _classes.firstWhere(
      (c) => c.id == classId,
      orElse: () => ClassModel(id: '', name: '', number: ''),
    );
    if (selectedClass.id.isEmpty) return;
    final prompt =
        'I need help understanding my ${selectedClass.name} (${selectedClass.number}) class. Can you provide an overview of what I should focus on based on my syllabis and chapters?';
    setState(() {
      _message = prompt;
    });
    await _sendMessage();
    await _fetchClasses();
  }

  // Welcome message for new chat messages
  Widget _buildWelcomeMessage() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Text(
              'Welcome to Syllab.AI Chat!',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 24,
                color: Color(0xFFF9E0C6),
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 12),
            Text(
              'Ask me anything about your courses, syllabi, or study materials.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Builds list of chats
  Widget _buildChatList() {
    if (_chats.isEmpty) {
      return const Center(
        child: Text(
          'No chats found.',
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      );
    }
    return ListView.builder(
      itemCount: _chats.length,
      itemBuilder: (context, index) {
        final chat = _chats[index];
        final isActive = _currentChat != null && _currentChat!.id == chat.id;
        return ListTile(
          selected: isActive,
          title: Text(chat.title),
          trailing: IconButton(
            icon: const Icon(Icons.delete),
            onPressed: () => _deleteChat(chat.id),
          ),
          onTap: () => _loadChat(chat.id),
        );
      },
    );
  }

  // Builds list of classes
  Widget _buildClassList() {
    if (_classes.isEmpty) {
      return const Center(
        child: Text(
          'No classes found.',
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      );
    }
    return ListView.builder(
      itemCount: _classes.length,
      itemBuilder: (context, index) {
        final cls = _classes[index];
        return ListTile(
          title: Text(cls.name),
          subtitle: Text(cls.number),
          onTap: () => _createContextualPrompt(cls.id),
        );
      },
    );
  }

  Widget _buildMessagesView() {
    final messages = _currentChat!.messages;
    return ListView.builder(
      controller: _scrollController,
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final msg = messages[index];
        final isAssistant = msg.sender == 'assistant';
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          alignment: isAssistant ? Alignment.centerLeft : Alignment.centerRight,
          child: Column(
            crossAxisAlignment:
                isAssistant ? CrossAxisAlignment.start : CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isAssistant ? Colors.white : const Color(0xFFF9E0C6),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(msg.content),
              ),
              if (msg.timestamp != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    _formatDate(msg.timestamp!),
                    style: const TextStyle(fontSize: 10, color: Colors.grey),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(8),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              enabled: !_loading,
              decoration: InputDecoration(
                hintText: 'Type your message here...',
                fillColor: const Color(0xFFF9E0C6),
                filled: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: (value) => setState(() => _message = value),
              onSubmitted: (_) => _sendMessage(),
              controller: TextEditingController(text: _message)
                ..selection = TextSelection.collapsed(offset: _message.length),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.send),
            onPressed: _loading || _message.trim().isEmpty ? null : _sendMessage,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFFF9E0C6),
        titleSpacing: 15,
        title: const Text(
          'say sylla-bye to your study troubles!',
          style: TextStyle(
            fontFamily: 'DynaPuff',
            fontWeight: FontWeight.w600,
            fontSize: 16,
            color: Color(0xFF246169),
          ),
        ),
        elevation: 0,
        flexibleSpace: Container(
          decoration: const BoxDecoration(color: Color(0xFFF9E0C6)),
        ),
        iconTheme: const IconThemeData(color: Colors.black),
        actions: [
          IconButton(
            icon: Icon(_isSidebarCollapsed ? Icons.menu : Icons.menu_open),
            onPressed: () {
              setState(() {
                _isSidebarCollapsed = !_isSidebarCollapsed;
              });
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          Column(
            children: [
              if (_error.isNotEmpty)
                Container(
                  color: Colors.red[100],
                  padding: const EdgeInsets.all(8),
                  margin: const EdgeInsets.all(8),
                  child: Text(
                    _error,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              Expanded(
                child: Container(
                  decoration: const BoxDecoration(
                    gradient: RadialGradient(
                      center: Alignment.center,
                      radius: 1.0,
                      colors: [
                        Color.fromRGBO(26, 27, 26, 1),
                        Color.fromRGBO(6, 54, 21, 1),
                      ],
                    ),
                  ),
                  child: _currentChat == null
                      ? _buildWelcomeMessage()
                      : _buildMessagesView(),
                ),
              ),
              _buildMessageInput(),
            ],
          ),
          AnimatedPositioned(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            top: 0,
            bottom: 0,
            left: _isSidebarCollapsed ? -300 : 0,
            width: 300,
            child: Material(
              elevation: 8,
              child: Container(
                color: const Color(0xFFF9E0C6),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  child: Column(
                    children: [
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _createNewChat,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF246169),
                            foregroundColor: Colors.white,
                            minimumSize: const Size(0, 40),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text('+ New Chat'),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => setState(() => _showEducationalContext = false),
                              style: ElevatedButton.styleFrom(
                                minimumSize: const Size(0, 40),
                                backgroundColor: !_showEducationalContext
                                    ? const Color(0xFF246169)
                                    : Colors.grey,
                                foregroundColor: Colors.white,
                                shape: const RoundedRectangleBorder(
                                  borderRadius: BorderRadius.only(
                                    topLeft: Radius.circular(8),
                                    bottomLeft: Radius.circular(8),
                                  ),
                                ),
                              ),
                              child: const Text('Chats'),
                            ),
                          ),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => setState(() => _showEducationalContext = true),
                              style: ElevatedButton.styleFrom(
                                minimumSize: const Size(0, 40),
                                backgroundColor: _showEducationalContext
                                    ? const Color(0xFF246169)
                                    : Colors.grey,
                                foregroundColor: Colors.white,
                                shape: const RoundedRectangleBorder(
                                  borderRadius: BorderRadius.only(
                                    topRight: Radius.circular(8),
                                    bottomRight: Radius.circular(8),
                                  ),
                                ),
                              ),
                              child: const Text('My Classes'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Expanded(
                        child: !_showEducationalContext
                            ? _buildChatList()
                            : _buildClassList(),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
